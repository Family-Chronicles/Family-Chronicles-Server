import { Config } from './types/config.type.js';
import express, { Express } from "express";
import dotenv from "dotenv";
import { ConfigService } from "./services/config.srvs.js";
import { DatabaseService } from "./services/database.srvs.js";
import { RouterService } from "./services/router.srvs.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

class Server {
	private app: Express = express();
	private port = 8080;

	constructor() {
		dotenv.config();
		ConfigService.getInstance();
		DatabaseService.getInstance();
		const routerService = RouterService.getInstance();

		routerService.buildUpRoutes(this.app);

		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(this.swagger()));

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
		});
	}

	private swagger(): object {
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
					name: config.meta.author.name,
					url: config.meta.homepage,
				},
			},
			servers: [
				{
					url: "http://localhost:8080",
					description: "Development server",
				},
			],
		};

		const options = {
			swaggerDefinition,
			// Paths to files containing OpenAPI definitions
			apis: ["./routes/*.js"],
		};

		return swaggerJSDoc(options);
	}
}

new Server();
