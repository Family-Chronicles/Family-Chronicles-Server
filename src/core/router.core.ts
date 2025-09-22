import { Express } from "express";
import { AuditLogController } from "../controllers/auditLog.controller";
import FamilyController from "../controllers/family.controller";
import IndexController from "../controllers/index.controller";
import PersonController from "../controllers/person.controller";
import TestController from "../controllers/test.controller";
import UserController from "../controllers/user.controller";
import LoginController from "../controllers/login.controller";

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
		new AuditLogController().routes(app);
        new LoginController().routes(app);
	}
}
