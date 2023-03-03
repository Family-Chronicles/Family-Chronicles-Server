import { Express, Request, Response } from "express";
import { DatabaseService } from "./database.srvs";
import { ConfigService } from "./config.srvs";

export class RouterService {
	private static instance: RouterService;

	private constructor() {}

	public static getInstance(): RouterService {
		if (!RouterService.instance) {
			RouterService.instance = new RouterService();
		}

		return RouterService.instance;
	}

	public buildUpRoutes(app: Express): void {

		const _config = ConfigService.getInstance()._config;
		const _database = DatabaseService.getInstance();

		app.get("/", (req: Request, res: Response) => {
			_database.listAllDatabases().then((dbs) => {
				res.send(
					"Express + TypeScript Server. Version: " +
						_config.meta.version +
						" | " +
						_config.meta.name +
						" | " +
						dbs.join(", ")
				);
			});
		});

		app.get("/test", (req: Request, res: Response) => {
			res.send("Test");
		});
	}
}
