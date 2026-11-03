import dotenv from "dotenv";
import * as url from "url";
import { Express } from "express";
import expressJSDocSwagger from "express-jsdoc-swagger";
import { Config } from "./types/config.type.js";
import { loadConfig } from "./services/config.srvs.js";
import { createDatabase } from "./services/database.srvs.js";
import { createApp, createContext, ensureAdmin } from "./core/app.core.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

function swagger(app: Express, config: Config): void {
	expressJSDocSwagger(app)({
		info: {
			title: "Express API for " + config.meta.name,
			version: config.meta.version,
			description: config.meta.description,
			license: {
				name: "Licensed Under " + config.meta.license,
				url: "https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE",
			},
		},
		security: {
			BearerAuth: { type: "http", scheme: "bearer" },
		},
		baseDir: __dirname,
		filesPattern: "./controllers/*.js",
		swaggerUIPath: "/docs",
		exposeSwaggerUI: true,
		exposeApiDocs: true,
		apiDocsPath: "/openapi.json",
		notRequiredAsNullable: false,
		multiple: false,
	} as never);
}

async function main(): Promise<void> {
	dotenv.config();
	const config = loadConfig();
	const database = await createDatabase(config.database);
	const ctx = createContext(config, database);

	if (await ensureAdmin(ctx)) {
		console.log(`👤 Created admin "${config.auth.adminEmail}"`);
	}

	const app = createApp(ctx, (a) => swagger(a, config));

	const server = app.listen(config.server.port, () => {
		console.log(
			`⚡️[server]: Server is running at http://localhost:${config.server.port}`
		);
	});

	const shutdown = () => {
		server.close(() => {
			database.close().finally(() => process.exit(0));
		});
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

main().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
