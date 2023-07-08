import { RateLimitRequestHandler } from "express-rate-limit";
import { IController } from "../interfaces/controller.interface.js";
import { Express, Request, Response } from "express";

/**
 * Test controller
 */
export class TestController implements IController {
	public routes(app: Express, rateLimiting: RateLimitRequestHandler): void {
		/**
		 * GET /test
		 * @summary This returns a test object
		 * @return {object} 200 - success response
		 * @example response - 200 - success response example
		 * {
		 * "test": "test"
		 * }
		 */
		app.get("/test", rateLimiting, (req: Request, res: Response) => {
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
