import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import expressJSDocSwagger from "express-jsdoc-swagger";
import rateLimiter from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import GlobalErrorHandler from "./core/error.core";
import RouterCore from "./core/router.core";
import ConfigService from "./services/config.srvs";
import DatabaseService from "./services/database.srvs";
import { Config } from "./types/config.type.js";

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
	private __filename = typeof __filename !== "undefined" ? __filename : "";
	private __dirname = typeof __dirname !== "undefined" ? __dirname : "";
	// private testDataCount = 0;

	constructor() {
		dotenv.config();
		ConfigService.getInstance(), DatabaseService.getInstance();
		new GlobalErrorHandler();

		const limiter = rateLimiter({
			max: 20,
			windowMs: 60 * 1000,
			message: {
				success: false,
				message: "Too many requests, please try again later.",
			},
			statusCode: 429,
			standardHeaders: true,
			legacyHeaders: false,
		});

		this.swagger(this.app);
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(helmet());
		this.app.use(morgan("combined"));
		this.app.use(limiter);
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

		RouterCore.buildUpRoutes(this.app);

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
			// Testdaten-Initialisierung entfernt für Testkontext
		});
	}

	private swagger(app: Express): object {
		const config = ConfigService.getInstance().config as Config;
		const swaggerDefinition = {
			openapi: "3.0.0",
			info: {
				title: "Express API for " + config.meta.name,
				version: config.meta.version,
				description:
					"This is a REST API application made with Express.\n\n" +
					`${config.meta.description} \n\n` +
					"[swagger.json](/api/v3/swagger.json) (auto-generated from JSDoc)",
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
			exposeApiDocs: true,
			// Open API JSON Docs endpoint.
			apiDocsPath: "/api/v3/swagger.json",
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

const serverInstance = new Server();
export default serverInstance["app"];
