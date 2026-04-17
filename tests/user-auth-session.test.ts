import request from "supertest";
import { RoleEnum } from "../src/enums/role.enum";
import User from "../src/models/user.model";
import app from "../src/server";
import DatabaseService from "../src/services/database.srvs";

import NodeRSA from "node-rsa";
import ConfigService from "../src/services/config.srvs";

jest.setTimeout(30000);

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

function getEncryptedPassword(password: string): string {
	const config = ConfigService.getInstance().config;
	const publicKey = new NodeRSA(config.auth.publicKey);
	return publicKey.encrypt(password, "base64");
}

beforeAll(async () => {
	// Testdatenbank: User anlegen
	try {
		await DatabaseService.getInstance().dropCollection("users");
	} catch (e) {
		// Collection may not exist yet.
	}
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
	} catch (e) {
		// Collection may already be gone.
	}
	await DatabaseService.getInstance().closeConnection();
});

describe("User Auth & Session", () => {
	it("should login and return a JWT token", async () => {
		const encryptedPassword = getEncryptedPassword("admin");
		const res = await request(app)
			.post("/user/login")
			.send({ username: "admin", password: encryptedPassword });
		expect(res.statusCode).toBe(200);
		expect(res.body.token).toBeDefined();
	});

	it("should reject registration with a duplicate email address", async () => {
		const res = await request(app)
			.post("/user/register")
			.send({
				Name: "admin_duplicate",
				Email: "ADMIN@example.com",
				Password: getEncryptedPassword("ComplexP@ssword123"),
			});

		expect(res.statusCode).toBe(400);
		expect(res.body.message).toBe("Email address already in use");
	});

	it("should logout and invalidate session", async () => {
		// Login first
		const encryptedPassword = getEncryptedPassword("admin");
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

	it("should invalidate the existing session after a password change", async () => {
		const loginRes = await request(app)
			.post("/user/login")
			.send({
				username: "admin",
				password: getEncryptedPassword("admin"),
			});
		const token = loginRes.body.token;

		const updateRes = await request(app)
			.put("/user/update")
			.set("Authorization", token)
			.send({
				Name: "admin",
				Password: getEncryptedPassword("NewComplexP@ssword123"),
			});

		expect(updateRes.statusCode).toBe(200);
		expect(updateRes.body.message).toBe(
			"Password updated successfully. Please log in again."
		);

		const logoutRes = await request(app)
			.delete("/user/logout")
			.set("Authorization", token);

		expect(logoutRes.statusCode).toBe(401);
	});
});
