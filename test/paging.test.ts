import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { auth, setup, TestApp } from "./helpers.js";

describe("person search and paging", () => {
	let t: TestApp;
	let h: Record<string, string>;
	const create = (FirstNames: string, LastNames: string, extra = {}) =>
		request(t.app)
			.post("/api/v1/persons")
			.set(h)
			.send({ FirstNames, LastNames, ...extra })
			.expect(201)
			.then((r) => r.body);

	beforeEach(async () => {
		t = await setup();
		h = auth(t.adminToken);
		await create("Anna", "Zander", {
			DateOfBirth: "1901-04-12",
			PlaceOfBirth: "Nürnberg",
		});
		await create("Bernd", "Müller", { DateOfDeath: "1980" });
		await create("Clara", "Becker", { BirthName: "Schäfer" });
		for (let i = 0; i < 12; i++) await create(`Kind${i}`, "Album");
	});

	it("pages sorted by last name with a total count", async () => {
		const first = await request(t.app)
			.get("/api/v1/persons?limit=5")
			.set(h)
			.expect(200);
		expect(first.headers["x-total-count"]).toBe("15");
		expect(first.body).toHaveLength(5);
		expect(first.body[0].LastNames).toEqual(["Album"]);
		const last = await request(t.app)
			.get("/api/v1/persons?limit=5&offset=12")
			.set(h);
		expect(
			last.body.map((p: { LastNames: string[] }) => p.LastNames[0])
		).toEqual(["Becker", "Müller", "Zander"]);
	});

	it("searches names, birth names and places without accents", async () => {
		const byPlace = await request(t.app)
			.get("/api/v1/persons?q=nurnberg")
			.set(h);
		expect(
			byPlace.body.map((p: { FirstNames: string[] }) => p.FirstNames[0])
		).toEqual(["Anna"]);
		const byBirthName = await request(t.app)
			.get("/api/v1/persons?q=schafer clara")
			.set(h);
		expect(byBirthName.body).toHaveLength(1);
		const special = await request(t.app).get("/api/v1/persons?q=.*").set(h);
		expect(special.body).toHaveLength(0);
	});

	it("filters living, deceased, birth date and ids", async () => {
		const deceased = await request(t.app)
			.get("/api/v1/persons?living=false")
			.set(h);
		expect(
			deceased.body.map((p: { FirstNames: string[] }) => p.FirstNames[0])
		).toEqual(["Bernd"]);
		const living = await request(t.app)
			.get("/api/v1/persons?living=true&limit=1")
			.set(h);
		expect(living.headers["x-total-count"]).toBe("14");
		const born = await request(t.app)
			.get("/api/v1/persons?born=1901-04")
			.set(h);
		expect(born.body).toHaveLength(1);
		const ids = [born.body[0].Id, deceased.body[0].Id];
		const byIds = await request(t.app)
			.get(`/api/v1/persons?ids=${ids.join(",")}`)
			.set(h);
		expect(byIds.body.map((p: { Id: string }) => p.Id).sort()).toEqual(
			[...ids].sort()
		);
	});

	it("keeps search fields up to date on changes", async () => {
		const anna = (await request(t.app).get("/api/v1/persons?q=anna").set(h))
			.body[0];
		await request(t.app)
			.put(`/api/v1/persons/${anna.Id}`)
			.set(h)
			.send({ LastNames: "Aaron" })
			.expect(200);
		expect(
			(await request(t.app).get("/api/v1/persons?q=zander").set(h)).body
		).toHaveLength(0);
		const first = await request(t.app)
			.get("/api/v1/persons?limit=1")
			.set(h);
		expect(first.body[0].Id).toBe(anna.Id);
	});

	it("returns dashboard stats", async () => {
		const stats = await request(t.app)
			.get("/api/v1/stats?month=4")
			.set(h)
			.expect(200);
		expect(stats.body.Persons).toBe(15);
		expect(stats.body.Living).toBe(14);
		expect(stats.body.Families).toBe(0);
		expect(stats.body.Recent).toHaveLength(6);
		expect(
			stats.body.Birthdays.map(
				(p: { FirstNames: string[] }) => p.FirstNames[0]
			)
		).toEqual(["Anna"]);
	});

	it("backfills search fields of old records", async () => {
		const { GenealogyService } = await import(
			"../src/services/genealogy.srvs.js"
		);
		const anna = (await request(t.app).get("/api/v1/persons?q=anna").set(h))
			.body[0];
		await t.ctx.repos.persons.update(anna.Id, {
			SearchText: undefined,
			SortName: undefined,
		});
		const service = new GenealogyService(t.ctx.repos, t.ctx.storage);
		expect(await service.backfillSearchFields()).toBe(1);
		expect(
			(await request(t.app).get("/api/v1/persons?q=anna").set(h)).body
		).toHaveLength(1);
	});
});
