import { Express, Request, Response } from "express";
import ConfigService from "../services/config.srvs.js";
import DatabaseService from "../services/database.srvs.js";
import { IController } from "../interfaces/controller.interface.js";
import { Config } from "../types/config.type.js";

/**
 * Index controller
 */
export default class IndexController implements IController {
	private _config = ConfigService.getInstance().config as Config;
	private _database = DatabaseService.getInstance();

	public routes(app: Express): void {
		/**
		 * GET /
		 * @summary This returns the base data of the API
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "version": "1.0.0",
		 * 	"name": "API"
		 * }
		 */
		app.get("/", (req: Request, res: Response) => {
			this.getBaseData(req, res);
		});
	}

	private getBaseData(req: Request, res: Response): void {
		const result = {
			version: this._config.meta.version,
			name: this._config.meta.name,
		};
		// eslint-disable-next-line no-unused-vars
		this._database.listAllDatabases().then((dbs) => {
			res.send(result);
		});
	}
}
