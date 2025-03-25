import { Express } from "express";
import FamilyController from "../controllers/family.controller.js";
import IndexController from "../controllers/index.controller.js";
import PersonController from "../controllers/person.controller.js";
import TestController from "../controllers/test.controller.js";
import UserController from "../controllers/user.controller.js";

/**
 * Router service
 * @class
 * @property {Function} buildUpRoutes - Build up routes
 * @example
 * RouterCore.getInstance().buildUpRoutes(app);
 * @returns {RouterCore} - Router service instance
 */
export default class RouterCore {
	public static buildUpRoutes(app: Express): void {
		new IndexController().routes(app);
		new TestController().routes(app);
		new UserController().routes(app);
		new PersonController().routes(app);
		new FamilyController().routes(app);
	}
}
