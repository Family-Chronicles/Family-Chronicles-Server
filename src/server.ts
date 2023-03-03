import express, { Express } from "express";
import dotenv from "dotenv";
import { ConfigService } from "./services/config.srvs.js";
import { DatabaseService } from "./services/database.srvs.js";
import { RouterService } from "./services/router.srvs.js";

class Server {
	private app: Express = express();
	private port = 8080;

	constructor() {
		dotenv.config();
		ConfigService.getInstance();
		DatabaseService.getInstance();
		const routerService = RouterService.getInstance();

		routerService.buildUpRoutes(this.app);

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
		});
	}
}

new Server();
