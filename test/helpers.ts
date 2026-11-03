import os from "os";
import path from "path";
import fs from "fs";
import request from "supertest";
import { Express } from "express";
import { loadConfig } from "../src/services/config.srvs.js";
import { createMemoryDatabase } from "../src/services/database.srvs.js";
import { createApp, createContext, ensureAdmin } from "../src/core/app.core.js";
import { AppContext } from "../src/core/context.core.js";

export const ADMIN = { Email: "admin@test.local", Password: "admin-password" };

export interface TestApp {
	app: Express;
	ctx: AppContext;
	adminToken: string;
	/** creates a user with the given role and returns its token */
	tokenFor(role: "Admin" | "Editor" | "Viewer"): Promise<string>;
}

export async function setup(
	env: Record<string, string> = {}
): Promise<TestApp> {
	const config = loadConfig({
		JWT_SECRET: "test-secret",
		ADMIN_EMAIL: ADMIN.Email,
		ADMIN_PASSWORD: ADMIN.Password,
		UPLOAD_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "fc-uploads-")),
		RATE_LIMIT_PER_MINUTE: "100000",
		DB_DRIVER: "memory",
		...env,
	});
	const ctx = createContext(config, createMemoryDatabase());
	await ensureAdmin(ctx);
	const app = createApp(ctx);

	const login = async (Email: string, Password: string) =>
		(
			await request(app)
				.post("/api/v1/auth/login")
				.send({ Email, Password })
		).body.token as string;

	const adminToken = await login(ADMIN.Email, ADMIN.Password);
	let counter = 0;

	return {
		app,
		ctx,
		adminToken,
		async tokenFor(role) {
			const Email = `${role.toLowerCase()}${counter++}@test.local`;
			await request(app)
				.post("/api/v1/users")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					Name: role,
					Email,
					Password: "password123",
					Role: role,
				})
				.expect(201);
			return login(Email, "password123");
		},
	};
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
