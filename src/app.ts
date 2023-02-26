import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { ConfigService } from "./services/config.srvs.js";
import { Config } from "./types/config.type.js";
import { DatabaseService } from "./services/database.srvs.js";

export class App {
	private app: Express = express();
	private port = 8080;
	private config: Config = ConfigService.getInstance()._config;

	constructor() {
		dotenv.config();
		DatabaseService.getInstance();

		this.app.get("/", (req: Request, res: Response) => {
			res.send(
				"Express + TypeScript Server. Version: " +
					this.config.meta.version +
					" | " +
					this.config.meta.name +
					" | "
			);
		});

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
		});
	}
}
