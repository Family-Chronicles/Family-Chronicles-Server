import { TestController } from "../controllers/test.controller.js";
import { Express } from "express";
import { IndexController } from "../controllers/index.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { RateLimitRequestHandler } from "express-rate-limit";

/**
 * Router service
 * @class
 * @property {Function} buildUpRoutes - Build up routes
 * @example
 * RouterService.getInstance().buildUpRoutes(app);
 * @returns {RouterService} - Router service instance
 */
export class RouterService {
	private static instance: RouterService;

	public static getInstance(): RouterService {
		if (!RouterService.instance) {
			RouterService.instance = new RouterService();
		}

		return RouterService.instance;
	}

	public buildUpRoutes(
		app: Express,
		rateLimiting: RateLimitRequestHandler
	): void {
		new IndexController().routes(app, rateLimiting);
		new TestController().routes(app, rateLimiting);
		new UserController().routes(app, rateLimiting);
	}
}
