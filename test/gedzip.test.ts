import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { unzipSync, zipSync } from "fflate";
import { auth, setup, TestApp } from "./helpers.js";
import { normalizePath } from "../src/gedcom/zip.js";

const GED = `0 HEAD
1 GEDC
2 VERS 5.5.1
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Anna /Schmidt/
1 OBJE
2 FILE C:\\Users\\Oma\\Fotos\\Hochzeit.JPG
3 FORM jpg
2 TITL Hochzeit 1950
1 OBJE @O1@
1 OBJE
2 FILE fehlt.png
0 @O1@ OBJE
1 FILE dokumente/brief.txt
2 FORM txt
2 TITL Brief an Karl
1 NOTE Geschrieben 1944
0 TRLR
`;

const enc = (s: string) => new TextEncoder().encode(s);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

function gedzip(extra: Record<string, Uint8Array> = {}) {
	return Buffer.from(
		zipSync({
			"stammbaum/tree.ged": enc(GED),
			"stammbaum/Fotos/Hochzeit.JPG": JPG,
			"stammbaum/dokumente/brief.txt": enc("Lieber Karl, ..."),
			...extra,
		})
	);
}

describe("GEDZIP", () => {
	let t: TestApp;
	beforeEach(async () => {
		t = await setup();
	});

	it("normalizes file paths", () => {
		expect(normalizePath("C:\\Users\\Oma\\Fotos\\A.JPG")).toBe(
			"users/oma/fotos/a.jpg"
		);
		expect(normalizePath("./media/x.png")).toBe("media/x.png");
		expect(normalizePath("file:///home/a/b.jpg")).toBe("home/a/b.jpg");
	});

	it("imports persons with their media files", async () => {
		const res = await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.attach("file", gedzip(), "stammbaum.zip")
			.expect(201);
		expect(res.body.Persons).toBe(1);
		expect(res.body.Media).toBe(2);
		expect(res.body.Warnings.join()).toContain(
			"1 media files referenced in the GEDCOM file were not found"
		);

		const media = await t.ctx.repos.media.findAll();
		const photo = media.find((m) => m.Type === "Image")!;
		expect(photo.Title).toBe("Hochzeit 1950");
		expect(photo.FileName).toBe("Hochzeit.JPG");
		expect(photo.MimeType).toBe("image/jpeg");
		const file = await request(t.app)
			.get(`/api/v1/media/${photo.Id}/file`)
			.set(auth(t.adminToken))
			.expect(200);
		expect(new Uint8Array(file.body)).toEqual(JPG);

		const letter = media.find((m) => m.Type === "Text")!;
		expect(letter.Title).toBe("Brief an Karl");
		expect(letter.Content).toBe("Lieber Karl, ...");
		expect(letter.Description).toBe("Geschrieben 1944");
	});

	it("warns about media when a plain GEDCOM file is imported", async () => {
		const res = await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.set("Content-Type", "text/plain")
			.send(GED)
			.expect(201);
		expect(res.body.Media).toBe(0);
		expect(res.body.Warnings.join()).toContain(
			"import a zip file (GEDZIP)"
		);
	});

	it("rejects zip files without a .ged file", async () => {
		const res = await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.attach(
				"file",
				Buffer.from(zipSync({ "a.txt": enc("x") })),
				"x.zip"
			)
			.expect(400);
		expect(res.body.message).toContain("no .ged file");
	});

	it("exports a GEDZIP that imports again with the same media", async () => {
		await request(t.app)
			.post("/api/v1/gedcom/import")
			.set(auth(t.adminToken))
			.attach("file", gedzip(), "stammbaum.zip")
			.expect(201);
		const exp = await request(t.app)
			.get("/api/v1/gedcom/export?format=zip")
			.set(auth(t.adminToken))
			.buffer(true)
			.parse((res, cb) => {
				const chunks: Buffer[] = [];
				res.on("data", (c: Buffer) => chunks.push(c));
				res.on("end", () => cb(null, Buffer.concat(chunks)));
			})
			.expect(200);
		expect(exp.headers["content-type"]).toContain("application/zip");
		const entries = unzipSync(new Uint8Array(exp.body));
		const ged = new TextDecoder().decode(entries["family-chronicles.ged"]);
		expect(ged).toMatch(
			/1 OBJE\r\n2 FILE media\/[\w-]+\.jpg\r\n3 FORM jpg\r\n3 TITL Hochzeit 1950/
		);
		expect(
			Object.keys(entries).filter((n) => n.startsWith("media/"))
		).toHaveLength(2);

		const other = await setup();
		const again = await request(other.app)
			.post("/api/v1/gedcom/import")
			.set(auth(other.adminToken))
			.attach("file", exp.body, "export.zip")
			.expect(201);
		expect(again.body.Media).toBe(2);
		expect(again.body.Warnings).toEqual([]);
	});
});
