import { Express, Request, Response } from "express";
import { ConfigService } from "../services/config.srvs.js";
import { DatabaseService } from "../services/database.srvs.js";
import { IRoute } from "../interfaces/route.interface.js";

export class IndexRoute implements IRoute {
	public static route(app: Express): void {
		const _config = ConfigService.getInstance()._config;
		const _database = DatabaseService.getInstance();

		/**
		 * @swagger
		 * /:
		 *  get:
		 * 		summary: Returns the server version and the databases
		 * 		description: Returns the server version and the databases
		 *
		 */
		app.get("/", (req: Request, res: Response) => {
			_database.listAllDatabases().then((dbs) => {
				res.send(
					_config.meta.name +
					". Version: " +
						_config.meta.version
				);
			});
		});
	}
}
