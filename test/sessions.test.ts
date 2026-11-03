import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Express } from "express";
import { loadConfig } from "../src/services/config.srvs.js";
import { createMemoryDatabase } from "../src/services/database.srvs.js";
import { createApp, createContext, ensureAdmin } from "../src/core/app.core.js";
import { MemoryMailer } from "../src/services/mail.srvs.js";
import { AppContext } from "../src/core/context.core.js";

const ADMIN = { Email: "admin@test.local", Password: "admin-password" };

describe("refresh tokens and password reset", () => {
	let app: Express;
	let ctx: AppContext;
	let mailer: MemoryMailer;

	const login = (Password = ADMIN.Password) =>
		request(app)
			.post("/api/v1/auth/login")
			.send({ Email: ADMIN.Email, Password });

	beforeEach(async () => {
		mailer = new MemoryMailer();
		ctx = createContext(
			loadConfig({
				JWT_SECRET: "test",
				ADMIN_EMAIL: ADMIN.Email,
				ADMIN_PASSWORD: ADMIN.Password,
				APP_URL: "https://family.example/",
				RATE_LIMIT_PER_MINUTE: "100000",
			}),
			createMemoryDatabase(),
			{ mailer }
		);
		await ensureAdmin(ctx);
		app = createApp(ctx);
	});

	it("issues and rotates refresh tokens", async () => {
		const first = await login().expect(200);
		expect(first.body.refreshToken).toMatch(/^[\w-]+\.[\w-]+$/);

		const refreshed = await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: first.body.refreshToken })
			.expect(200);
		expect(refreshed.body.token).toBeTypeOf("string");
		expect(refreshed.body.refreshToken).not.toBe(first.body.refreshToken);
		await request(app)
			.get("/api/v1/auth/me")
			.set("Authorization", `Bearer ${refreshed.body.token}`)
			.expect(200);

		// the old refresh token is no longer valid after rotation
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: first.body.refreshToken })
			.expect(401);
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: "garbage" })
			.expect(401);
		// refresh tokens are only stored as hash
		const sessions = await ctx.repos.sessions.findAll();
		expect(JSON.stringify(sessions)).not.toContain(
			refreshed.body.refreshToken.split(".")[1]
		);
	});

	it("logs out", async () => {
		const { body } = await login();
		await request(app)
			.post("/api/v1/auth/logout")
			.send({ RefreshToken: body.refreshToken })
			.expect(200);
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: body.refreshToken })
			.expect(401);
	});

	it("ends other sessions when the password changes", async () => {
		const deviceA = (await login()).body;
		const deviceB = (await login()).body;
		await request(app)
			.put("/api/v1/auth/me/password")
			.set("Authorization", `Bearer ${deviceA.token}`)
			.send({
				CurrentPassword: ADMIN.Password,
				NewPassword: "new-password",
				RefreshToken: deviceA.refreshToken,
			})
			.expect(200);
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: deviceB.refreshToken })
			.expect(401);
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: deviceA.refreshToken })
			.expect(200);
	});

	it("resets a forgotten password by email", async () => {
		const session = (await login()).body;
		const config = await request(app)
			.get("/api/v1/auth/config")
			.expect(200);
		expect(config.body.passwordReset).toBe(true);

		await request(app)
			.post("/api/v1/auth/password-reset")
			.send({ Email: "unknown@test.local" })
			.expect(202);
		expect(mailer.sent).toHaveLength(0);

		await request(app)
			.post("/api/v1/auth/password-reset")
			.send({ Email: ADMIN.Email.toUpperCase() })
			.expect(202);
		expect(mailer.sent).toHaveLength(1);
		expect(mailer.sent[0].to).toBe(ADMIN.Email);
		const link =
			/https:\/\/family\.example\/#\/reset-password\?token=(\S+)/.exec(
				mailer.sent[0].text
			);
		expect(link).not.toBeNull();
		const token = decodeURIComponent(link![1]);

		// a second request within a minute sends no new mail
		await request(app)
			.post("/api/v1/auth/password-reset")
			.send({ Email: ADMIN.Email })
			.expect(202);
		expect(mailer.sent).toHaveLength(1);

		await request(app)
			.post("/api/v1/auth/password-reset/confirm")
			.send({ Token: token, NewPassword: "short" })
			.expect(400);
		await request(app)
			.post("/api/v1/auth/password-reset/confirm")
			.send({ Token: token, NewPassword: "brand-new-password" })
			.expect(200);
		// the link works only once, old sessions are ended
		await request(app)
			.post("/api/v1/auth/password-reset/confirm")
			.send({ Token: token, NewPassword: "another-password" })
			.expect(400);
		await request(app)
			.post("/api/v1/auth/refresh")
			.send({ RefreshToken: session.refreshToken })
			.expect(401);
		await login("brand-new-password").expect(200);
		await login().expect(401);
	});

	it("rejects expired reset links", async () => {
		const user = (await ctx.repos.users.findOne({ Email: ADMIN.Email }))!;
		const token = await ctx.auth.createPasswordReset(user);
		const [reset] = await ctx.repos.passwordResets.findAll();
		await ctx.repos.passwordResets.update(reset.Id, {
			ExpiresAt: new Date(Date.now() - 1000).toISOString(),
		});
		await request(app)
			.post("/api/v1/auth/password-reset/confirm")
			.send({ Token: token, NewPassword: "brand-new-password" })
			.expect(400);
	});

	it("is disabled without a mail server", async () => {
		const plain = createContext(
			loadConfig({ JWT_SECRET: "x", ADMIN_PASSWORD: "admin-password" }),
			createMemoryDatabase()
		);
		const plainApp = createApp(plain);
		expect(
			(await request(plainApp).get("/api/v1/auth/config")).body
				.passwordReset
		).toBe(false);
		await request(plainApp)
			.post("/api/v1/auth/password-reset")
			.send({ Email: "a@b.c" })
			.expect(503);
	});
});
