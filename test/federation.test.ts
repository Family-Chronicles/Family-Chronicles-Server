import { afterEach, beforeEach, describe, expect, it } from "vitest";
import http from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { auth, setup, TestApp } from "./helpers.js";
import {
	TokenCipher,
	normalizePeerUrl,
} from "../src/services/federation.srvs.js";

describe("API tokens", () => {
	let t: TestApp;
	beforeEach(async () => {
		t = await setup();
	});

	it("creates tokens for a user, uses and revokes them", async () => {
		const viewer = await request(t.app)
			.post("/api/v1/users")
			.set(auth(t.adminToken))
			.send({
				Name: "Instanz B",
				Email: "b@test.local",
				Password: "password123",
				Role: "Viewer",
			})
			.expect(201);
		const created = await request(t.app)
			.post("/api/v1/tokens")
			.set(auth(t.adminToken))
			.send({ UserId: viewer.body.Id, Name: "für Instanz A" })
			.expect(201);
		expect(created.body.Token).toMatch(/^fc_/);
		expect(created.body.TokenHash).toBeUndefined();

		await request(t.app)
			.get("/api/v1/persons")
			.set(auth(created.body.Token))
			.expect(200);
		// a viewer token cannot write
		await request(t.app)
			.post("/api/v1/persons")
			.set(auth(created.body.Token))
			.send({ FirstNames: "X", LastNames: "Y" })
			.expect(403);

		const list = await request(t.app)
			.get("/api/v1/tokens")
			.set(auth(t.adminToken));
		expect(list.body).toHaveLength(1);
		expect(list.body[0].LastUsedAt).not.toBeNull();
		expect(JSON.stringify(list.body)).not.toContain(
			created.body.Token.split(".")[1]
		);

		await request(t.app)
			.delete(`/api/v1/tokens/${created.body.Id}`)
			.set(auth(t.adminToken))
			.expect(200);
		await request(t.app)
			.get("/api/v1/persons")
			.set(auth(created.body.Token))
			.expect(401);
		await request(t.app)
			.get("/api/v1/persons")
			.set(auth("fc_nonsense.token"))
			.expect(401);
	});

	it("is limited to admins", async () => {
		const editor = await t.tokenFor("Editor");
		await request(t.app)
			.get("/api/v1/tokens")
			.set(auth(editor))
			.expect(403);
	});
});

describe("federation between two instances", () => {
	let a: TestApp;
	let b: TestApp;
	let server: http.Server;
	let bUrl: string;
	let bToken: string;
	let remotePersonId: string;

	beforeEach(async () => {
		a = await setup();
		b = await setup();
		server = http.createServer(b.app);
		await new Promise<void>((resolve) =>
			server.listen(0, "127.0.0.1", resolve)
		);
		bUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

		const person = await request(b.app)
			.post("/api/v1/persons")
			.set(auth(b.adminToken))
			.send({
				FirstNames: "Karl",
				LastNames: "Schmidt",
				DateOfBirth: "1901",
				Notes: "private notes",
			})
			.expect(201);
		remotePersonId = person.body.Id;
		const user = await request(b.app)
			.post("/api/v1/users")
			.set(auth(b.adminToken))
			.send({
				Name: "Instanz A",
				Email: "a@test.local",
				Password: "password123",
				Role: "Viewer",
			});
		bToken = (
			await request(b.app)
				.post("/api/v1/tokens")
				.set(auth(b.adminToken))
				.send({ UserId: user.body.Id, Name: "A" })
		).body.Token;
	});

	afterEach(async () => {
		await new Promise((resolve) => server.close(resolve));
	});

	const connect = (body: object) =>
		request(a.app)
			.post("/api/v1/federation/peers")
			.set(auth(a.adminToken))
			.send(body);

	it("connects, searches, links and shows remote persons", async () => {
		const peer = await connect({
			Name: "Familie B",
			BaseUrl: bUrl,
			Token: bToken,
		}).expect(201);
		expect(peer.body.BaseUrl).toBe(`${bUrl}/api/v1`);
		expect(peer.body.Status).toBe("Ok");
		expect(peer.body.TokenEncrypted).toBeUndefined();
		// the token is stored encrypted
		const stored = (await a.ctx.repos.peers.findAll())[0];
		expect(stored.TokenEncrypted).not.toContain(bToken);
		expect(a.ctx.cipher.decrypt(stored.TokenEncrypted)).toBe(bToken);

		const found = await request(a.app)
			.get(`/api/v1/federation/peers/${peer.body.Id}/persons?q=karl`)
			.set(auth(a.adminToken))
			.expect(200);
		expect(found.body).toHaveLength(1);
		expect(found.body[0].FirstNames).toEqual(["Karl"]);
		// only basic fields are passed on
		expect(found.body[0].Notes).toBeUndefined();

		const local = await request(a.app)
			.post("/api/v1/persons")
			.set(auth(a.adminToken))
			.send({ FirstNames: "Karl", LastNames: "Schmidt" });
		const link = await request(a.app)
			.post("/api/v1/federation/links")
			.set(auth(a.adminToken))
			.send({
				PersonId: local.body.Id,
				PeerId: peer.body.Id,
				RemotePersonId: remotePersonId,
			})
			.expect(201);
		expect(link.body.RemoteName).toBe("Karl Schmidt");
		await request(a.app)
			.post("/api/v1/federation/links")
			.set(auth(a.adminToken))
			.send({
				PersonId: local.body.Id,
				PeerId: peer.body.Id,
				RemotePersonId: remotePersonId,
			})
			.expect(409);

		const viewer = await a.tokenFor("Viewer");
		const linksOfPerson = await request(a.app)
			.get(`/api/v1/federation/links?personId=${local.body.Id}`)
			.set(auth(viewer))
			.expect(200);
		expect(linksOfPerson.body[0].PeerName).toBe("Familie B");
		const remote = await request(a.app)
			.get(
				`/api/v1/federation/peers/${peer.body.Id}/persons/${remotePersonId}`
			)
			.set(auth(viewer))
			.expect(200);
		expect(remote.body.DateOfBirth).toBe("1901");
		// viewers may look at links but not search other instances
		await request(a.app)
			.get(`/api/v1/federation/peers/${peer.body.Id}/persons?q=k`)
			.set(auth(viewer))
			.expect(403);

		// deleting the local person removes its links
		await request(a.app)
			.delete(`/api/v1/persons/${local.body.Id}`)
			.set(auth(a.adminToken))
			.expect(200);
		expect(await a.ctx.repos.links.count()).toBe(0);
	});

	it("reports a revoked token and removes links with the peer", async () => {
		const peer = (
			await connect({ Name: "B", BaseUrl: bUrl, Token: bToken }).expect(
				201
			)
		).body;
		const local = await request(a.app)
			.post("/api/v1/persons")
			.set(auth(a.adminToken))
			.send({ FirstNames: "K", LastNames: "S" });
		await request(a.app)
			.post("/api/v1/federation/links")
			.set(auth(a.adminToken))
			.send({
				PersonId: local.body.Id,
				PeerId: peer.Id,
				RemotePersonId: remotePersonId,
			})
			.expect(201);

		const tokens = await request(b.app)
			.get("/api/v1/tokens")
			.set(auth(b.adminToken));
		await request(b.app)
			.delete(`/api/v1/tokens/${tokens.body[0].Id}`)
			.set(auth(b.adminToken))
			.expect(200);

		const checked = await request(a.app)
			.post(`/api/v1/federation/peers/${peer.Id}/check`)
			.set(auth(a.adminToken))
			.expect(200);
		expect(checked.body.Status).toBe("Unauthorized");
		const failing = await request(a.app)
			.get(
				`/api/v1/federation/peers/${peer.Id}/persons/${remotePersonId}`
			)
			.set(auth(a.adminToken))
			.expect(502);
		expect(failing.body.message).toContain("rejected");

		await request(a.app)
			.delete(`/api/v1/federation/peers/${peer.Id}`)
			.set(auth(a.adminToken))
			.expect(200);
		expect(await a.ctx.repos.links.count()).toBe(0);
	});

	it("rejects bad URLs, wrong tokens and non-admins", async () => {
		await connect({
			Name: "B",
			BaseUrl: "ftp://example.org",
			Token: bToken,
		}).expect(400);
		await connect({
			Name: "B",
			BaseUrl: `http://user:pw@127.0.0.1:1`,
			Token: bToken,
		}).expect(400);
		await connect({
			Name: "B",
			BaseUrl: bUrl,
			Token: "fc_wrong.token-value",
		}).expect(400);
		await connect({
			Name: "B",
			BaseUrl: "http://127.0.0.1:1",
			Token: bToken,
		}).expect(400);
		const editor = await a.tokenFor("Editor");
		await request(a.app)
			.post("/api/v1/federation/peers")
			.set(auth(editor))
			.send({ Name: "B", BaseUrl: bUrl, Token: bToken })
			.expect(403);
	});
});

describe("federation helpers", () => {
	it("normalizes peer URLs", () => {
		expect(normalizePeerUrl("https://chronik.example.org/")).toBe(
			"https://chronik.example.org/api/v1"
		);
		expect(
			normalizePeerUrl("https://chronik.example.org/api/v1/?x=1#y")
		).toBe("https://chronik.example.org/api/v1");
	});

	it("encrypts and detects tampering", () => {
		const cipher = new TokenCipher("secret");
		const encrypted = cipher.encrypt("fc_abc.def");
		expect(cipher.decrypt(encrypted)).toBe("fc_abc.def");
		expect(() => new TokenCipher("other").decrypt(encrypted)).toThrow();
	});
});
