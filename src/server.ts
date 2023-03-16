import { Config } from "./types/config.type.js";
import express, { Express } from "express";
import dotenv from "dotenv";
import { ConfigService } from "./services/config.srvs.js";
import { DatabaseService } from "./services/database.srvs.js";
import { RouterService } from "./services/router.srvs.js";
import expressJSDocSwagger from "express-jsdoc-swagger";
import * as url from "url";

/**
 * Server
 * @class
 * @property {Express} app - Express app
 * @property {number} port - Port
 * @property {string} __filename - Filename
 * @property {string} __dirname - Directory name
 * @constructor
 * @returns {Server} - Server instance
 * @example
 * const server = new Server();
 */
class Server {
	private app: Express = express();
	private port = 8080;
	private __filename = url.fileURLToPath(import.meta.url);
	private __dirname = url.fileURLToPath(new URL(".", import.meta.url));

	constructor() {
		dotenv.config();
		ConfigService.getInstance();
		DatabaseService.getInstance();
		RouterService.getInstance().buildUpRoutes(this.app);

		this.swagger(this.app);
		this.app.use(express.json());
		this.app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			res.header(
				"Access-Control-Allow-Headers",
				"Origin, X-Requested-With, Content-Type, Accept, Authorization"
			);
			res.header(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE"
			);
			res.header("Access-Control-Allow-Credentials", "true");
			next();
		});

		/**
		 * GET /api/v1
		 * @summary This is the summary of the endpoint
		 * @return {object} 200 - success response
		 */
		this.app.get("/api/v1", (req, res) =>
			res.json({
				success: true,
			})
		);

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
		});
	}

	private swagger(app: Express): object {
		const config = ConfigService.getInstance()._config as Config;
		const swaggerDefinition = {
			openapi: "3.0.0",
			info: {
				title: "Express API for " + config.meta.name,
				version: "1.0.0",
				description: "This is a REST API application made with Express.",
				license: {
					name: "Licensed Under " + config.meta.license,
					url: "https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE",
				},
				contact: {
					name: config.meta.name,
					url: config.meta.homepage,
				},
			},
			servers: [
				{
					url: "http://localhost:8080",
					description: "Development server",
				},
			],
			security: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
				},
			},
			baseDir: this.__dirname,
			// Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
			filesPattern: "./**/*.js",
			// URL where SwaggerUI will be rendered
			swaggerUIPath: "/docs",
			// Expose OpenAPI UI
			exposeSwaggerUI: true,
			// Expose Open API JSON Docs documentation in `apiDocsPath` path.
			exposeApiDocs: false,
			// Open API JSON Docs endpoint.
			apiDocsPath: "/v3/docs",
			// Set non-required fields as nullable by default
			notRequiredAsNullable: false,
			// You can customize your UI options.
			// you can extend swagger-ui-express config. You can checkout an example of this
			// in the `example/configuration/swaggerOptions.js`
			swaggerUiOptions: {},
			// multiple option in case you want more that one instance
			multiple: true,
		};

		return expressJSDocSwagger(app)(swaggerDefinition);
	}
}

new Server();
