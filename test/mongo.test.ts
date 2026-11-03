/**
 * Integration tests against a real MongoDB.
 * Run with TEST_MONGO_URL set, e.g. TEST_MONGO_URL=mongodb://localhost:27017 npm test
 * (CI starts a MongoDB service container for this).
 */
import crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
	Database,
	createMongoDatabase,
} from "../src/services/database.srvs.js";
import { loadConfig } from "../src/services/config.srvs.js";
import { createApp, createContext, ensureAdmin } from "../src/core/app.core.js";
import { Person } from "../src/models/person.model.js";
import { ChangeBus, ChangeEvent } from "../src/services/events.srvs.js";
import { MongoEventRelay } from "../src/services/relay.srvs.js";

const MONGO_URL = process.env.TEST_MONGO_URL;

const person = (first: string): Person => ({
	Id: crypto.randomUUID(),
	FirstNames: [first],
	MiddleNames: [],
	LastNames: ["Test"],
	BirthName: null,
	Gender: "Unknown",
	DateOfBirth: null,
	PlaceOfBirth: null,
	DateOfDeath: null,
	PlaceOfDeath: null,
	CauseOfDeath: null,
	Notes: "",
	CreatedAt: new Date().toISOString(),
	UpdatedAt: new Date().toISOString(),
});

describe.skipIf(!MONGO_URL)("MongoDB", () => {
	let db: Database;
	const dbName = `fc-test-${Date.now()}`;

	beforeAll(async () => {
		db = await createMongoDatabase({
			driver: "mongo",
			host: MONGO_URL!,
			databasename: dbName,
			username: process.env.TEST_MONGO_USER ?? "",
			password: process.env.TEST_MONGO_PASSWORD ?? "",
		});
	});

	afterAll(async () => {
		await db?.close();
	});

	it("stores, finds, updates and deletes documents without exposing _id", async () => {
		const repo = db.repositories.persons;
		const anna = await repo.create(person("Anna"));
		expect(await repo.findById(anna.Id)).toEqual(anna);
		expect(Object.keys((await repo.findById(anna.Id))!)).not.toContain(
			"_id"
		);

		const updated = await repo.update(anna.Id, { Notes: "hello" });
		expect(updated?.Notes).toBe("hello");
		expect(updated && "_id" in updated).toBe(false);
		expect(await repo.update("missing", { Notes: "x" })).toBeNull();

		expect(await repo.createMany([person("B"), person("C")])).toBe(2);
		expect(await repo.count()).toBe(3);
		expect(
			await repo.findOne({ FirstNames: ["B"] } as Partial<Person>)
		).not.toBeNull();
		expect(
			(await repo.findByIds([anna.Id, "missing"])).map((p) => p.Id)
		).toEqual([anna.Id]);

		expect(await repo.delete(anna.Id)).toBe(true);
		expect(await repo.delete(anna.Id)).toBe(false);
		expect(
			await repo.deleteMany({ LastNames: ["Test"] } as Partial<Person>)
		).toBe(2);
	});

	it("queries with patterns, null checks, sorting and paging", async () => {
		const repo = db.repositories.persons;
		await repo.deleteMany({});
		await repo.createMany([
			{ ...person("Anna"), SortName: "b", DateOfDeath: "1990" },
			{ ...person("Bert"), SortName: "a" },
			{ ...person("Carl"), SortName: "c" },
		]);
		const page = await repo.query({
			sort: [{ field: "SortName", direction: 1 }],
			limit: 2,
		});
		expect(page.total).toBe(3);
		expect(page.items.map((p) => p.FirstNames[0])).toEqual([
			"Bert",
			"Anna",
		]);
		expect(page.items[0]).not.toHaveProperty("_id");
		const dead = await repo.query({
			notNull: [{ field: "DateOfDeath", value: true }],
		});
		expect(dead.items.map((p) => p.FirstNames[0])).toEqual(["Anna"]);
		const living = await repo.query({
			notNull: [{ field: "DateOfDeath", value: false }],
		});
		expect(living.total).toBe(2);
		const match = await repo.query({
			match: [{ field: "SortName", pattern: /^c/ }],
		});
		expect(match.items.map((p) => p.FirstNames[0])).toEqual(["Carl"]);
		await repo.deleteMany({});
	});

	it("shares change events between instances", async () => {
		const busA = new ChangeBus();
		const busB = new ChangeBus();
		const relayA = new MongoEventRelay(db.db!, busA);
		const relayB = new MongoEventRelay(db.db!, busB);
		await relayA.start();
		await relayB.start();
		await Promise.all([relayA.whenReady(), relayB.whenReady()]);
		const receivedA: ChangeEvent[] = [];
		const receivedB: ChangeEvent[] = [];
		busA.subscribe((e) => receivedA.push(e));
		busB.subscribe((e) => receivedB.push(e));

		busA.emit("persons", "created", ["p1"]);
		const start = Date.now();
		while (!receivedB.length && Date.now() - start < 5000) {
			await new Promise((r) => setTimeout(r, 50));
		}
		await new Promise((r) => setTimeout(r, 300));
		relayA.stop();
		relayB.stop();

		expect(receivedB).toEqual([
			{ Entity: "persons", Action: "created", Ids: ["p1"], Remote: true },
		]);
		// A got its own event once (locally), not a second time through MongoDB
		expect(receivedA).toEqual([
			{ Entity: "persons", Action: "created", Ids: ["p1"] },
		]);
	});

	it("enforces unique ids", async () => {
		const p = person("Dup");
		await db.repositories.persons.create(p);
		await expect(db.repositories.persons.create(p)).rejects.toThrow();
	});

	it("runs the API on MongoDB", async () => {
		const config = loadConfig({
			JWT_SECRET: "test",
			ADMIN_EMAIL: "admin@test.local",
			ADMIN_PASSWORD: "admin-password",
		});
		const ctx = createContext(config, db);
		await db.repositories.users.deleteMany({});
		await ensureAdmin(ctx);
		const app = createApp(ctx);
		const login = await request(app)
			.post("/api/v1/auth/login")
			.send({ Email: "admin@test.local", Password: "admin-password" })
			.expect(200);
		const h = { Authorization: `Bearer ${login.body.token}` };

		const p = await request(app)
			.post("/api/v1/persons")
			.set(h)
			.send({ FirstNames: "Mongo", LastNames: "Test", CauseOfDeath: "x" })
			.expect(201);
		const put = await request(app)
			.put(`/api/v1/persons/${p.body.Id}`)
			.set(h)
			.send({ PlaceOfBirth: "Berlin" })
			.expect(200);
		expect(put.body.PlaceOfBirth).toBe("Berlin");
		expect(put.body.CauseOfDeath).toBe("x");
		expect(put.body._id).toBeUndefined();
		await request(app)
			.delete(`/api/v1/persons/${p.body.Id}`)
			.set(h)
			.expect(200);
	});
});
