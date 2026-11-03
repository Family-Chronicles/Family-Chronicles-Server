import fs from "fs";
import path from "path";
import * as url from "url";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { auth, setup, TestApp } from "./helpers.js";
import { fromGedcomDate, toGedcomDate } from "../src/gedcom/dates.js";
import { parseGedcom, GedcomError } from "../src/gedcom/parser.js";
import { importGedcom } from "../src/gedcom/importer.js";
import { exportGedcom } from "../src/gedcom/exporter.js";
import { createMemoryDatabase } from "../src/services/database.srvs.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const SAMPLE = fs.readFileSync(path.join(__dirname, "fixtures/sample.ged"));

describe("GEDCOM dates", () => {
	it("converts GEDCOM dates to partial ISO dates", () => {
		expect(fromGedcomDate("12 APR 1901")).toEqual({
			value: "1901-04-12",
			approximate: false,
		});
		expect(fromGedcomDate("APR 1901")).toEqual({
			value: "1901-04",
			approximate: false,
		});
		expect(fromGedcomDate("1901")).toEqual({
			value: "1901",
			approximate: false,
		});
		expect(fromGedcomDate("ABT 1901")).toEqual({
			value: "1901",
			approximate: true,
		});
		expect(fromGedcomDate("BET 1900 AND 1910")).toEqual({
			value: "1900",
			approximate: true,
		});
		expect(fromGedcomDate("sometime").value).toBeNull();
	});

	it("converts back", () => {
		expect(toGedcomDate("1901-04-12")).toBe("12 APR 1901");
		expect(toGedcomDate("1901-04")).toBe("APR 1901");
		expect(toGedcomDate("1901")).toBe("1901");
	});
});

describe("GEDCOM parser", () => {
	it("merges CONC and CONT lines", () => {
		const { records } = parseGedcom(SAMPLE.toString());
		const note = records[1].children.find((c) => c.tag === "NOTE")!;
		expect(note.value).toBe(
			"Schmied in dritter Generation.\nZog 1930 nach Fürth und eröffnete eine eigene Werkstatt."
		);
	});

	it("rejects malformed files with a line number", () => {
		expect(() => parseGedcom("0 HEAD\n2 SOUR x\n0 TRLR")).toThrow(
			GedcomError
		);
		expect(() => parseGedcom("0 HEAD\n2 SOUR x\n0 TRLR")).toThrow(/Line 2/);
		expect(() => parseGedcom("hello world")).toThrow(/Line 1/);
		expect(() => parseGedcom("0 @I1@ INDI\n0 TRLR")).toThrow(/HEAD/);
	});
});

describe("GEDCOM import and export", () => {
	it("imports persons, names, events and families", async () => {
		const db = createMemoryDatabase();
		const result = await importGedcom(SAMPLE.toString(), db.repositories, {
			familyName: "Schmidt",
		});
		expect(result.Persons).toBe(4);
		expect(result.Warnings.join()).toContain("@I99@");

		const persons = await db.repositories.persons.findAll();
		const karl = persons.find((p) => p.FirstNames[0] === "Karl")!;
		expect(karl.MiddleNames).toEqual(["Friedrich"]);
		expect(karl.DateOfBirth).toBe("1901-04-12");
		expect(karl.PlaceOfBirth).toBe("Nürnberg, Bayern");
		expect(karl.DateOfDeath).toBe("1975");
		expect(karl.CauseOfDeath).toBe("Herzversagen");
		expect(karl.Notes).toContain("Death (GEDCOM): ABT 1975");

		const erika = persons.find((p) => p.FirstNames[0] === "Erika")!;
		expect(erika.BirthName).toBe("Meier");
		expect(erika.Notes).toBe("Geborene Meier aus Erlangen.");
		expect(erika.DateOfBirth).toBe("1905-03");

		const rels = await db.repositories.relationships.findAll();
		expect(rels.filter((r) => r.Type === "Spouse")).toHaveLength(1);
		expect(rels.find((r) => r.Type === "Spouse")!.StartDate).toBe(
			"1928-06-03"
		);
		const parentLinks = rels.filter((r) => r.Type === "Parent");
		expect(parentLinks).toHaveLength(4);
		const lena = persons.find((p) => p.FirstNames[0] === "Lena")!;
		expect(
			parentLinks
				.filter((r) => r.RelatedPersonId === lena.Id)
				.every((r) => r.Role === "Adoptiert")
		).toBe(true);

		expect(result.FamilyId).not.toBeNull();
		expect(await db.repositories.memberships.count()).toBe(4);
	});

	it("exports valid GEDCOM that imports again to the same data", async () => {
		const first = createMemoryDatabase();
		await importGedcom(SAMPLE.toString(), first.repositories);
		const exported = exportGedcom(
			await first.repositories.persons.findAll(),
			await first.repositories.relationships.findAll(),
			{ name: "test", version: "1" }
		);
		expect(exported.startsWith("0 HEAD")).toBe(true);
		expect(exported.trimEnd().endsWith("0 TRLR")).toBe(true);
		expect(exported).toContain("1 NAME Karl Friedrich /Schmidt/");
		expect(exported).toContain("2 DATE 3 JUN 1928");

		const second = createMemoryDatabase();
		const result = await importGedcom(exported, second.repositories);
		expect(result.Persons).toBe(4);
		expect(result.Warnings).toEqual([]);
		const rels = await second.repositories.relationships.findAll();
		expect(rels.filter((r) => r.Type === "Parent")).toHaveLength(4);
		expect(rels.filter((r) => r.Type === "Spouse")).toHaveLength(1);
		const karl = (await second.repositories.persons.findAll()).find(
			(p) => p.FirstNames[0] === "Karl"
		)!;
		expect(karl.DateOfBirth).toBe("1901-04-12");
	});

	it("handles large files quickly", async () => {
		const lines = ["0 HEAD", "1 GEDC", "2 VERS 5.5.1", "1 CHAR UTF-8"];
		const n = 20000;
		for (let i = 1; i <= n; i++) {
			lines.push(
				`0 @I${i}@ INDI`,
				`1 NAME Person${i} /Test/`,
				"1 BIRT",
				`2 DATE ${(i % 28) + 1} JAN 1900`
			);
		}
		for (let i = 1; i < n; i += 2) {
			lines.push(`0 @F${i}@ FAM`, `1 HUSB @I${i}@`, `1 WIFE @I${i + 1}@`);
		}
		lines.push("0 TRLR");
		const db = createMemoryDatabase();
		const start = performance.now();
		const result = await importGedcom(lines.join("\n"), db.repositories);
		expect(result.Persons).toBe(n);
		expect(result.Relationships).toBe(n / 2);
		expect(performance.now() - start).toBeLessThan(5000);
	});
});

describe("GEDCOM API", () => {
	let t: TestApp;
	beforeEach(async () => {
		t = await setup();
	});

	it("imports a file upload and exports it again", async () => {
		const res = await request(t.app)
			.post("/api/v1/gedcom/import?family=Schmidt")
			.set(auth(t.adminToken))
			.attach("file", SAMPLE, "sample.ged")
			.expect(201);
		expect(res.body.Persons).toBe(4);

		const persons = await request(t.app)
			.get("/api/v1/persons")
			.set(auth(t.adminToken));
		expect(persons.body).toHaveLength(4);

		const exp = await request(t.app)
			.get("/api/v1/gedcom/export")
			.set(auth(t.adminToken))
			.expect(200);
		expect(exp.headers["content-disposition"]).toContain(".ged");
		expect(exp.text).toContain("0 TRLR");
	});

	it("accepts a raw text body", async () => {
		await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.set("Content-Type", "text/plain")
			.send(SAMPLE.toString())
			.expect(201);
	});

	it("returns 400 with the line for invalid files", async () => {
		const res = await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.set("Content-Type", "text/plain")
			.send("0 HEAD\nthis is not gedcom\n")
			.expect(400);
		expect(res.body.message).toContain("Line 2");
		await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.expect(400);
	});

	it("is limited to editors", async () => {
		const viewer = await t.tokenFor("Viewer");
		await request(t.app)
			.get("/api/v1/gedcom/export")
			.set(auth(viewer))
			.expect(403);
		await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(viewer))
			.attach("file", SAMPLE, "sample.ged")
			.expect(403);
	});
});
