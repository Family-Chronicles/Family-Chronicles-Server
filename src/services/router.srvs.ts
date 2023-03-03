import { Express } from "express";
import { IndexRoute } from "../routes/index.route.js";
import { TestRoute } from "../routes/test.route.js";

export class RouterService {
	private static instance: RouterService;

	public static getInstance(): RouterService {
		if (!RouterService.instance) {
			RouterService.instance = new RouterService();
		}

		return RouterService.instance;
	}

	public buildUpRoutes(app: Express): void {
		IndexRoute.route(app);
		TestRoute.route(app);
	}
}
