import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { auth, setup, TestApp } from "./helpers.js";

describe("persons, families, relationships, media", () => {
	let t: TestApp;
	let h: Record<string, string>;
	const person = async (first: string, last: string, extra = {}) =>
		(
			await request(t.app)
				.post("/api/v1/persons")
				.set(h)
				.send({ FirstNames: first, LastNames: last, ...extra })
				.expect(201)
		).body;
	const link = (
		PersonId: string,
		RelatedPersonId: string,
		Type: string,
		Role = ""
	) =>
		request(t.app)
			.post("/api/v1/relationships")
			.set(h)
			.send({ PersonId, RelatedPersonId, Type, Role });

	beforeEach(async () => {
		t = await setup();
		h = auth(t.adminToken);
	});

	it("creates, updates, searches and validates persons", async () => {
		const p = await person("Anna Maria", "Müller", {
			MiddleNames: "Luise",
			DateOfBirth: "1901-04-12",
			CauseOfDeath: "Old age",
		});
		expect(p.FirstNames).toEqual(["Anna", "Maria"]);
		expect(p.MiddleNames).toEqual(["Luise"]);

		const updated = await request(t.app)
			.put(`/api/v1/persons/${p.Id}`)
			.set(h)
			.send({ PlaceOfBirth: "Berlin" })
			.expect(200);
		expect(updated.body.PlaceOfBirth).toBe("Berlin");
		expect(updated.body.CauseOfDeath).toBe("Old age");

		const search = await request(t.app)
			.get("/api/v1/persons?q=anna%20muller")
			.set(h)
			.expect(200);
		expect(search.body).toHaveLength(1);
		const born = await request(t.app)
			.get("/api/v1/persons?born=1901")
			.set(h);
		expect(born.body).toHaveLength(1);

		await request(t.app)
			.post("/api/v1/persons")
			.set(h)
			.send({
				FirstNames: ["X"],
				LastNames: ["Y"],
				DateOfBirth: "12.04.1901",
			})
			.expect(400);
		await request(t.app).get("/api/v1/persons/unknown").set(h).expect(404);
	});

	it("builds a family tree and normalizes child links", async () => {
		const grandpa = await person("Karl", "Schmidt");
		const father = await person("Hans", "Schmidt");
		const mother = await person("Erika", "Schmidt", { BirthName: "Meier" });
		const child = await person("Lena", "Schmidt");
		const sibling = await person("Paul", "Schmidt");

		await link(grandpa.Id, father.Id, "Parent", "Vater").expect(201);
		await link(father.Id, child.Id, "Parent", "Vater").expect(201);
		await link(father.Id, sibling.Id, "Parent", "Vater").expect(201);
		// "Lena is child of Erika" is stored as "Erika is parent of Lena"
		const r = await link(child.Id, mother.Id, "Child", "Tochter").expect(
			201
		);
		expect(r.body.Type).toBe("Parent");
		expect(r.body.PersonId).toBe(mother.Id);
		expect(r.body.RelatedPersonId).toBe(child.Id);
		await link(father.Id, mother.Id, "Spouse").expect(201);

		// duplicates, symmetric duplicates and self links are rejected
		await link(mother.Id, father.Id, "Spouse").expect(409);
		await link(child.Id, child.Id, "Sibling").expect(400);
		await link(child.Id, father.Id, "Parent").expect(400);

		const tree = await request(t.app)
			.get(`/api/v1/persons/${father.Id}/tree?depth=2`)
			.set(h)
			.expect(200);
		expect(tree.body.Ancestors.Parents[0].Person.Id).toBe(grandpa.Id);
		expect(tree.body.Descendants.Partners[0].Id).toBe(mother.Id);
		expect(
			tree.body.Descendants.Children.map(
				(c: { Person: { Id: string } }) => c.Person.Id
			).sort()
		).toEqual([child.Id, sibling.Id].sort());

		const childTree = await request(t.app)
			.get(`/api/v1/persons/${child.Id}/tree`)
			.set(h);
		expect(
			childTree.body.Siblings.map((s: { Id: string }) => s.Id)
		).toEqual([sibling.Id]);
		expect(childTree.body.Ancestors.Parents).toHaveLength(2);
	});

	it("manages families and memberships", async () => {
		const a = await person("Anna", "Schmidt");
		const b = await person("Bernd", "Schmitt");
		const fam = (
			await request(t.app)
				.post("/api/v1/families")
				.set(h)
				.send({ Name: "Schmidt", HistoricalNames: ["Schmitt"] })
				.expect(201)
		).body;

		for (const [p, Role] of [
			[a, "Mutter"],
			[b, "Stiefsohn"],
		] as const) {
			await request(t.app)
				.post("/api/v1/memberships")
				.set(h)
				.send({
					FamilyId: fam.Id,
					PersonId: p.Id,
					Role,
					StartDate: "1950",
				})
				.expect(201);
		}
		await request(t.app)
			.post("/api/v1/memberships")
			.set(h)
			.send({ FamilyId: fam.Id, PersonId: a.Id })
			.expect(409);

		const detail = await request(t.app)
			.get(`/api/v1/families/${fam.Id}`)
			.set(h);
		expect(detail.body.Surnames).toEqual(["Schmidt", "Schmitt"]);
		const members = await request(t.app)
			.get(`/api/v1/families/${fam.Id}/members`)
			.set(h);
		expect(members.body).toHaveLength(2);
		expect(members.body[0].Person.FirstNames).toBeDefined();
		const list = await request(t.app).get("/api/v1/families").set(h);
		expect(list.body[0].MemberCount).toBe(2);

		// deleting a person removes its memberships
		await request(t.app)
			.delete(`/api/v1/persons/${b.Id}`)
			.set(h)
			.expect(200);
		const after = await request(t.app)
			.get(`/api/v1/families/${fam.Id}/members`)
			.set(h);
		expect(after.body).toHaveLength(1);

		await request(t.app)
			.delete(`/api/v1/families/${fam.Id}`)
			.set(h)
			.expect(200);
		expect(await t.ctx.repos.memberships.count()).toBe(0);
	});

	it("uploads media, tags persons and cleans up", async () => {
		const owner = await person("Anna", "Schmidt");
		const other = await person("Bernd", "Schmidt");

		const upload = await request(t.app)
			.post("/api/v1/media")
			.set(h)
			.field("PersonId", owner.Id)
			.field("Title", "Hochzeit")
			.attach("file", Buffer.from("fake-png"), {
				filename: "hochzeit.png",
				contentType: "image/png",
			})
			.expect(201);
		expect(upload.body.Type).toBe("Image");

		const file = await request(t.app)
			.get(`/api/v1/media/${upload.body.Id}/file`)
			.set(h)
			.expect(200);
		expect(file.headers["content-type"]).toContain("image/png");
		expect(Buffer.from(file.body).toString()).toBe("fake-png");

		const text = await request(t.app)
			.post("/api/v1/media")
			.set(h)
			.send({
				PersonId: owner.Id,
				Title: "Brief",
				Content: "Liebe Anna, ...",
			})
			.expect(201);
		expect(text.body.Type).toBe("Text");

		await request(t.app)
			.post(`/api/v1/media/${upload.body.Id}/tags`)
			.set(h)
			.send({ PersonId: other.Id, X: 0.4, Y: 0.3 })
			.expect(201);

		const otherMedia = await request(t.app)
			.get(`/api/v1/persons/${other.Id}/media`)
			.set(h);
		expect(otherMedia.body.Tagged).toHaveLength(1);

		await request(t.app)
			.delete(`/api/v1/persons/${owner.Id}`)
			.set(h)
			.expect(200);
		expect(await t.ctx.repos.media.count()).toBe(0);
		expect(await t.ctx.repos.tags.count()).toBe(0);
	});
});
