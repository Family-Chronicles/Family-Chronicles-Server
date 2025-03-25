import { IController } from "../interfaces/controller.interface.js";
import { Express, Request, Response } from "express";

/**
 * Test controller
 */
export default class TestController implements IController {
	public routes(app: Express): void {
		/**
		 * GET /test
		 * @summary This returns a test object
		 * @return {object} 200 - success response
		 * @example response - 200 - success response example
		 * {
		 * "test": "test"
		 * }
		 */
		app.get("/test", (req: Request, res: Response) => {
			this.getTest(req, res);
		});
	}

	private getTest(req: Request, res: Response): void {
		const result = {
			test: "test",
		};
		res.send(result);
	}
}
