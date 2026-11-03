import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { ADMIN, auth, setup, TestApp } from "./helpers.js";

describe("auth", () => {
	let t: TestApp;
	beforeEach(async () => {
		t = await setup();
	});

	it("logs in and returns the user without password", async () => {
		const res = await request(t.app)
			.post("/api/v1/auth/login")
			.send(ADMIN)
			.expect(200);
		expect(res.body.token).toBeTypeOf("string");
		expect(res.body.user.Role).toBe("Admin");
		expect(res.body.user.PasswordHash).toBeUndefined();
	});

	it("rejects wrong passwords", async () => {
		await request(t.app)
			.post("/api/v1/auth/login")
			.send({ ...ADMIN, Password: "wrong" })
			.expect(401);
	});

	it("requires a token", async () => {
		await request(t.app).get("/api/v1/persons").expect(401);
		await request(t.app)
			.get("/api/v1/persons")
			.set(auth("garbage"))
			.expect(401);
	});

	it("returns the current user", async () => {
		const res = await request(t.app)
			.get("/api/v1/auth/me")
			.set(auth(t.adminToken))
			.expect(200);
		expect(res.body.Email).toBe(ADMIN.Email);
	});

	it("changes the own password", async () => {
		await request(t.app)
			.put("/api/v1/auth/me/password")
			.set(auth(t.adminToken))
			.send({
				CurrentPassword: ADMIN.Password,
				NewPassword: "new-password",
			})
			.expect(200);
		await request(t.app).post("/api/v1/auth/login").send(ADMIN).expect(401);
		await request(t.app)
			.post("/api/v1/auth/login")
			.send({ Email: ADMIN.Email, Password: "new-password" })
			.expect(200);
	});
});

describe("roles", () => {
	let t: TestApp;
	beforeEach(async () => {
		t = await setup();
	});

	it("viewers can read but not write", async () => {
		const viewer = await t.tokenFor("Viewer");
		await request(t.app)
			.get("/api/v1/persons")
			.set(auth(viewer))
			.expect(200);
		await request(t.app)
			.post("/api/v1/persons")
			.set(auth(viewer))
			.send({ FirstNames: ["A"], LastNames: ["B"] })
			.expect(403);
	});

	it("editors can write persons but not manage users", async () => {
		const editor = await t.tokenFor("Editor");
		await request(t.app)
			.post("/api/v1/persons")
			.set(auth(editor))
			.send({ FirstNames: ["A"], LastNames: ["B"] })
			.expect(201);
		await request(t.app).get("/api/v1/users").set(auth(editor)).expect(403);
	});

	it("protects the last admin", async () => {
		const me = await request(t.app)
			.get("/api/v1/auth/me")
			.set(auth(t.adminToken));
		await request(t.app)
			.put(`/api/v1/users/${me.body.Id}`)
			.set(auth(t.adminToken))
			.send({ Role: "Viewer" })
			.expect(409);
		await request(t.app)
			.delete(`/api/v1/users/${me.body.Id}`)
			.set(auth(t.adminToken))
			.expect(409);
	});

	it("rejects duplicate emails", async () => {
		await request(t.app)
			.post("/api/v1/users")
			.set(auth(t.adminToken))
			.send({
				Name: "X",
				Email: ADMIN.Email.toUpperCase(),
				Password: "password123",
			})
			.expect(409);
	});
});
