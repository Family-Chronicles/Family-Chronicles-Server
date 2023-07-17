import { TestController } from "../controllers/test.controller.js";
import { Express } from "express";
import { IndexController } from "../controllers/index.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { PersonController } from "../controllers/person.controller.js";

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

	public buildUpRoutes(app: Express): void {
		new IndexController().routes(app);
		new TestController().routes(app);
		new UserController().routes(app);
		new PersonController().routes(app);
	}
}
