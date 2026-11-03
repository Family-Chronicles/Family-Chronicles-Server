import { afterEach, beforeEach, describe, expect, it } from "vitest";
import http from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { auth, setup, TestApp } from "./helpers.js";

/** Starts an app on a random port and returns its URL */
async function listen(t: TestApp) {
	const server = http.createServer(t.app);
	await new Promise<void>((resolve) =>
		server.listen(0, "127.0.0.1", resolve)
	);
	return {
		server,
		url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
	};
}

/** An API token of `t` for a new viewer user */
async function viewerToken(t: TestApp, name: string) {
	const user = await request(t.app)
		.post("/api/v1/users")
		.set(auth(t.adminToken))
		.send({
			Name: name,
			Email: `${name.toLowerCase()}@test.local`,
			Password: "password123",
			Role: "Viewer",
		});
	return (
		await request(t.app)
			.post("/api/v1/tokens")
			.set(auth(t.adminToken))
			.send({ UserId: user.body.Id, Name: name })
	).body.Token as string;
}

describe("federation: remote trees, importing persons, connection requests", () => {
	let a: TestApp;
	let b: TestApp;
	let servers: http.Server[] = [];
	let aUrl: string;
	let bUrl: string;
	let karl: string;
	let hans: string;

	beforeEach(async () => {
		// A needs a fixed public URL, so start a placeholder server first to learn the port
		const placeholder = http.createServer();
		await new Promise<void>((resolve) =>
			placeholder.listen(0, "127.0.0.1", resolve)
		);
		const port = (placeholder.address() as AddressInfo).port;
		await new Promise((resolve) => placeholder.close(resolve));
		aUrl = `http://127.0.0.1:${port}`;
		a = await setup({ PUBLIC_URL: aUrl, INSTANCE_NAME: "Familie A" });
		const serverA = http.createServer(a.app);
		await new Promise<void>((resolve) =>
			serverA.listen(port, "127.0.0.1", resolve)
		);

		b = await setup({ INSTANCE_NAME: "Familie B" });
		const listenB = await listen(b);
		bUrl = listenB.url;
		servers = [serverA, listenB.server];

		const h = auth(b.adminToken);
		karl = (
			await request(b.app).post("/api/v1/persons").set(h).send({
				FirstNames: "Karl",
				LastNames: "Berg",
				Gender: "Male",
				Notes: "secret",
			})
		).body.Id;
		hans = (
			await request(b.app).post("/api/v1/persons").set(h).send({
				FirstNames: "Hans",
				LastNames: "Berg",
				DateOfBirth: "1950",
			})
		).body.Id;
		await request(b.app)
			.post("/api/v1/relationships")
			.set(h)
			.send({ PersonId: karl, RelatedPersonId: hans, Type: "Parent" })
			.expect(201);
	});

	afterEach(async () => {
		await Promise.all(
			servers.map((s) => new Promise((resolve) => s.close(resolve)))
		);
	});

	const connect = async (mutual = false) =>
		request(a.app)
			.post("/api/v1/federation/peers")
			.set(auth(a.adminToken))
			.send({
				Name: "Familie B",
				BaseUrl: bUrl,
				Token: await viewerToken(b, "InstanzA"),
				Mutual: mutual,
				Message: "Hallo B",
			})
			.expect(201);

	it("shows the family tree of a remote person with basic fields only", async () => {
		const peer = (await connect()).body;
		const tree = await request(a.app)
			.get(
				`/api/v1/federation/peers/${peer.Id}/persons/${hans}/tree?depth=2`
			)
			.set(auth(a.adminToken))
			.expect(200);
		expect(tree.body.Root.FirstNames).toEqual(["Hans"]);
		expect(tree.body.Ancestors.Parents[0].Person.FirstNames).toEqual([
			"Karl",
		]);
		expect(tree.body.Ancestors.Parents[0].Person.Notes).toBeUndefined();
	});

	it("copies a remote person and links it", async () => {
		const peer = (await connect()).body;
		const copy = await request(a.app)
			.post(`/api/v1/federation/peers/${peer.Id}/persons/${hans}/import`)
			.set(auth(a.adminToken))
			.expect(201);
		expect(copy.body.Person.FirstNames).toEqual(["Hans"]);
		expect(copy.body.Person.DateOfBirth).toBe("1950");
		expect(copy.body.Person.Notes).toBe("Übernommen aus Familie B");
		expect(copy.body.Link.Relation).toBe("SamePerson");
		const search = await request(a.app)
			.get("/api/v1/persons?q=hans")
			.set(auth(a.adminToken));
		expect(search.body).toHaveLength(1);
		await request(a.app)
			.post(`/api/v1/federation/peers/${peer.Id}/persons/${hans}/import`)
			.set(auth(a.adminToken))
			.expect(409);
		const viewer = await a.tokenFor("Viewer");
		await request(a.app)
			.post(`/api/v1/federation/peers/${peer.Id}/persons/${karl}/import`)
			.set(auth(viewer))
			.expect(403);
	});

	it("connects both ways after the other admin accepts", async () => {
		const peer = await connect(true);
		expect(peer.body.RequestSent).toBe(true);
		expect(peer.body.RequestError).toBeNull();

		const pending = await request(b.app)
			.get("/api/v1/federation/requests")
			.set(auth(b.adminToken))
			.expect(200);
		expect(pending.body).toHaveLength(1);
		expect(pending.body[0]).toMatchObject({
			Name: "Familie A",
			BaseUrl: `${aUrl}/api/v1`,
			Message: "Hallo B",
		});
		expect(pending.body[0].TokenEncrypted).toBeUndefined();
		const editorB = await b.tokenFor("Editor");
		await request(b.app)
			.get("/api/v1/federation/requests")
			.set(auth(editorB))
			.expect(403);

		const accepted = await request(b.app)
			.post(`/api/v1/federation/requests/${pending.body[0].Id}/accept`)
			.set(auth(b.adminToken))
			.expect(201);
		expect(accepted.body.Status).toBe("Ok");
		expect(
			(
				await request(b.app)
					.get("/api/v1/federation/requests")
					.set(auth(b.adminToken))
			).body
		).toHaveLength(0);

		// B can now read from A
		await request(a.app)
			.post("/api/v1/persons")
			.set(auth(a.adminToken))
			.send({ FirstNames: "Anna", LastNames: "Tal" });
		const found = await request(b.app)
			.get(`/api/v1/federation/peers/${accepted.body.Id}/persons?q=anna`)
			.set(auth(b.adminToken))
			.expect(200);
		expect(found.body[0].FirstNames).toEqual(["Anna"]);
		// A created a viewer user for B
		const users = await request(a.app)
			.get("/api/v1/users")
			.set(auth(a.adminToken));
		expect(
			users.body.some(
				(u: { Name: string; Role: string }) =>
					u.Name === "Instanz Familie B" && u.Role === "Viewer"
			)
		).toBe(true);
	});

	it("rejects requests without API token and mutual connections without PUBLIC_URL", async () => {
		await request(b.app)
			.post("/api/v1/federation/requests")
			.set(auth(b.adminToken))
			.send({ Name: "X", BaseUrl: aUrl, Token: "fc_aaaaaaaaaa.bbbb" })
			.expect(403);
		const c = await setup();
		await request(c.app)
			.post("/api/v1/federation/peers")
			.set(auth(c.adminToken))
			.send({
				Name: "B",
				BaseUrl: bUrl,
				Token: await viewerToken(b, "InstanzC"),
				Mutual: true,
			})
			.expect(400);
	});

	it("rejects connection requests on decline", async () => {
		await connect(true);
		const pending = await request(b.app)
			.get("/api/v1/federation/requests")
			.set(auth(b.adminToken));
		await request(b.app)
			.delete(`/api/v1/federation/requests/${pending.body[0].Id}`)
			.set(auth(b.adminToken))
			.expect(200);
		expect(await b.ctx.repos.peers.count()).toBe(0);
	});
});
