import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as url from "url";
import { Config } from "../types/config.type.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

/**
 * Loads the configuration: defaults from `config/default.config.json`,
 * overridden by environment variables (see `.env.example`).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
	const file = path.resolve(__dirname, "../config/default.config.json");
	const config: Config = JSON.parse(fs.readFileSync(file, "utf8"));

	const str = (key: string, fallback: string) => env[key] ?? fallback;
	const num = (key: string, fallback: number) =>
		env[key] !== undefined && env[key] !== "" ? Number(env[key]) : fallback;

	config.server.port = num("PORT", config.server.port);
	config.server.corsOrigins = env.CORS_ORIGINS
		? env.CORS_ORIGINS.split(",").map((o) => o.trim())
		: config.server.corsOrigins;
	config.server.rateLimitPerMinute = num(
		"RATE_LIMIT_PER_MINUTE",
		config.server.rateLimitPerMinute
	);
	config.server.uploadDir = str("UPLOAD_DIR", config.server.uploadDir);
	config.server.maxUploadMb = num("MAX_UPLOAD_MB", config.server.maxUploadMb);
	config.server.liveRelay =
		str("LIVE_RELAY", config.server.liveRelay) === "mongo"
			? "mongo"
			: "none";

	config.auth.jwtSecret = str("JWT_SECRET", config.auth.jwtSecret);
	config.auth.tokenLifetime = str(
		"TOKEN_LIFETIME",
		config.auth.tokenLifetime
	);
	config.auth.adminName = str("ADMIN_NAME", config.auth.adminName);
	config.auth.adminEmail = str("ADMIN_EMAIL", config.auth.adminEmail);
	config.auth.adminPassword = str(
		"ADMIN_PASSWORD",
		config.auth.adminPassword
	);

	config.database.driver = str(
		"DB_DRIVER",
		config.database.driver
	) as Config["database"]["driver"];
	config.database.host = str("DB_HOST", config.database.host);
	config.database.databasename = str("DB_NAME", config.database.databasename);
	config.database.username = str("DB_USER", config.database.username);
	config.database.password = str("DB_PASSWORD", config.database.password);

	if (!config.auth.jwtSecret) {
		// Without a fixed secret all tokens become invalid on restart.
		console.warn(
			"⚠️  JWT_SECRET is not set – using a random secret for this run."
		);
		config.auth.jwtSecret = crypto.randomBytes(32).toString("hex");
	}

	return config;
}
