import { describe, expect, it } from "vitest";
import request from "supertest";
import { loadConfig } from "../src/services/config.srvs.js";
import { createMemoryDatabase } from "../src/services/database.srvs.js";
import { createApp, createContext, ensureAdmin } from "../src/core/app.core.js";

const contextWith = (env: Record<string, string>) =>
	createContext(
		loadConfig({ JWT_SECRET: "test", DB_DRIVER: "memory", ...env }),
		createMemoryDatabase()
	);

describe("initial admin", () => {
	it("requires ADMIN_PASSWORD instead of generating one", async () => {
		await expect(ensureAdmin(contextWith({}))).rejects.toThrow(
			/ADMIN_PASSWORD/
		);
	});

	it("creates the admin once", async () => {
		const ctx = contextWith({ ADMIN_PASSWORD: "long-enough" });
		expect(await ensureAdmin(ctx)).toBe(true);
		expect(await ensureAdmin(ctx)).toBe(false);
		expect(await ctx.repos.users.count()).toBe(1);
	});
});

describe("CORS", () => {
	it("sends no CORS headers by default", async () => {
		const app = createApp(contextWith({}));
		const res = await request(app)
			.get("/api/v1/health")
			.set("Origin", "https://evil.example");
		expect(res.headers["access-control-allow-origin"]).toBeUndefined();
	});

	it("allows only configured origins", async () => {
		const app = createApp(
			contextWith({ CORS_ORIGINS: "https://family.example" })
		);
		const ok = await request(app)
			.get("/api/v1/health")
			.set("Origin", "https://family.example");
		expect(ok.headers["access-control-allow-origin"]).toBe(
			"https://family.example"
		);
		const other = await request(app)
			.get("/api/v1/health")
			.set("Origin", "https://evil.example");
		expect(other.headers["access-control-allow-origin"]).toBeUndefined();
	});
});
