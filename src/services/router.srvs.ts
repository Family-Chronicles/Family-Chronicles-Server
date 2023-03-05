import { TestController } from "../controllers/test.controller.js";
import { Express } from "express";
import { IndexController } from "../controllers/index.controller.js";
import { UserController } from "../controllers/user.controller.js";

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
	}
}
