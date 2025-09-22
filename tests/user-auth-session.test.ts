import request from "supertest";
import app from "../src/server";
import DatabaseService from "../src/services/database.srvs";
import User from "../src/models/user.model";
import { RoleEnum } from "../src/enums/role.enum";

import NodeRSA from "node-rsa";
import ConfigService from "../src/services/config.srvs";

const testUser = new User(
	null,
	"admin",
	"admin@example.com",
	"admin", // Passwort wird im Controller gehasht
	new Date(),
	new Date(),
	RoleEnum.ADMIN,
	false,
	undefined
);

beforeAll(async () => {
	// Testdatenbank: User anlegen
	try {
		await DatabaseService.getInstance().dropCollection("users");
	} catch (e) {}
	// Passwort einfach als Hash von 'admin' speichern
	const AuthService = require("../src/services/auth.srvs").default;
	const hashedPassword = AuthService.getInstance().hashPassword("admin");
	const user = new User(
		null,
		testUser.Name,
		testUser.Email,
		hashedPassword,
		testUser.CreatedAt,
		testUser.UpdatedAt,
		testUser.Role,
		testUser.Locked,
		undefined
	);
	await DatabaseService.getInstance().addUser(user);
});

afterAll(async () => {
	// Testdatenbank: User entfernen
	try {
		await DatabaseService.getInstance().dropCollection("users");
	} catch (e) {}
});

describe("User Auth & Session", () => {
	it("should login and return a JWT token", async () => {
		const config = ConfigService.getInstance().config;
		const publicKey = new NodeRSA(config.auth.publicKey);
		const encryptedPassword = publicKey.encrypt("admin", "base64");
		const res = await request(app)
			.post("/user/login")
			.send({ username: "admin", password: encryptedPassword });
		expect(res.statusCode).toBe(200);
		expect(res.body.token).toBeDefined();
	});

	it("should logout and invalidate session", async () => {
		// Login first
		const config = ConfigService.getInstance().config;
		const publicKey = new NodeRSA(config.auth.publicKey);
		const encryptedPassword = publicKey.encrypt("admin", "base64");
		const loginRes = await request(app)
			.post("/user/login")
			.send({ username: "admin", password: encryptedPassword });
		const token = loginRes.body.token;
		// Logout
		const logoutRes = await request(app)
			.delete("/user/logout")
			.set("Authorization", token);
		expect(logoutRes.statusCode).toBe(200);
	});
});
