import express, { Express } from "express";
import cors from "cors";
import rateLimiter from "express-rate-limit";
import crypto from "crypto";
import { AppContext } from "./context.core.js";
import { errorHandler, HttpError, now } from "./http.core.js";
import { Config } from "../types/config.type.js";
import { Database, Repositories } from "../services/database.srvs.js";
import { Mailer, SmtpMailer } from "../services/mail.srvs.js";
import { AuthService, hashPassword } from "../services/auth.srvs.js";
import { GenealogyService } from "../services/genealogy.srvs.js";
import { FileStorage } from "../storage/file.storage.js";
import { ChangeBus, ObservableRepository } from "../services/events.srvs.js";
import { indexController } from "../controllers/index.controller.js";
import { authController } from "../controllers/auth.controller.js";
import { userController } from "../controllers/user.controller.js";
import { personController } from "../controllers/person.controller.js";
import {
	familyController,
	membershipController,
} from "../controllers/family.controller.js";
import { relationshipController } from "../controllers/relationship.controller.js";
import { mediaController } from "../controllers/media.controller.js";
import { gedcomController } from "../controllers/gedcom.controller.js";
import { statsController } from "../controllers/stats.controller.js";

export const API_PREFIX = "/api/v1";

export function createContext(
	config: Config,
	database: Database,
	options: { mailer?: Mailer | null } = {}
): AppContext {
	const events = new ChangeBus();
	// every write is reported on the change bus (live updates)
	const repos = Object.fromEntries(
		Object.entries(database.repositories).map(([name, repo]) => [
			name,
			new ObservableRepository(repo, name, events),
		])
	) as unknown as Repositories;
	return {
		config,
		repos,
		events,
		auth: new AuthService(repos, config.auth),
		mailer:
			options.mailer !== undefined
				? options.mailer
				: config.mail.smtpUrl
				? new SmtpMailer(config.mail.smtpUrl, config.mail.from)
				: null,
		storage: new FileStorage(config.server.uploadDir),
	};
}

/**
 * Creates the initial admin when no user exists yet.
 * The password must be configured (ADMIN_PASSWORD); it is never generated or logged.
 * Returns true when an admin was created.
 */
export async function ensureAdmin(ctx: AppContext): Promise<boolean> {
	if ((await ctx.repos.users.count()) > 0) return false;
	const password = ctx.config.auth.adminPassword;
	if (password.length < 8) {
		throw new Error(
			"No user exists yet. Set ADMIN_PASSWORD (at least 8 characters) to create the first admin."
		);
	}
	await ctx.repos.users.create({
		Id: crypto.randomUUID(),
		Name: ctx.config.auth.adminName,
		Email: ctx.config.auth.adminEmail.toLowerCase(),
		PasswordHash: await hashPassword(password),
		Role: "Admin",
		CreatedAt: now(),
		UpdatedAt: now(),
	});
	return true;
}

/** Builds the express app – without listening, so tests can use it directly */
export function createApp(
	ctx: AppContext,
	extend?: (app: Express) => void
): Express {
	const app = express();
	const genealogy = new GenealogyService(ctx.repos, ctx.storage);
	const origins = ctx.config.server.corsOrigins.filter((o) => o !== "*");

	app.disable("x-powered-by");
	// Cross-origin access only for explicitly listed origins (CORS_ORIGINS).
	// The web app is normally served from the same origin (dev proxy / nginx).
	if (origins.length > 0) {
		app.use(
			cors({
				origin: origins,
				methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
				allowedHeaders: ["Content-Type", "Authorization"],
				exposedHeaders: ["X-Total-Count"],
			})
		);
	}
	app.use(
		rateLimiter({
			max: ctx.config.server.rateLimitPerMinute,
			windowMs: 60 * 1000,
			standardHeaders: true,
			legacyHeaders: false,
			message: {
				status: 429,
				message: "Too many requests, please try again later.",
			},
		})
	);
	app.use(express.json({ limit: "1mb" }));
	app.use(express.urlencoded({ extended: false }));

	const api = express.Router();
	api.use("/", indexController(ctx));
	api.use("/auth", authController(ctx));
	api.use("/users", userController(ctx));
	api.use("/persons", personController(ctx, genealogy));
	api.use("/families", familyController(ctx, genealogy));
	api.use("/memberships", membershipController(ctx));
	api.use("/relationships", relationshipController(ctx));
	api.use("/media", mediaController(ctx, genealogy));
	api.use("/gedcom", gedcomController(ctx));
	api.use("/stats", statsController(ctx));
	app.use(API_PREFIX, api);
	extend?.(app);

	app.use((req, res, next) => next(new HttpError(404, "Route not found")));
	app.use(errorHandler);
	return app;
}
