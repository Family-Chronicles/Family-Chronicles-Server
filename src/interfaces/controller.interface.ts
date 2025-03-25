import { Express } from "express";

/**
 * Controller interface
 * @interface
 * @property {Function} routes - Routes controller
 * @example
 * export default class UserController implements IController {
 * 	public routes(app: Express): void {
 * 		// Routes
 * 	}
 * }
 */
export abstract class IController {
	// eslint-disable-next-line no-unused-vars
	public static routes(app: Express): void {
		throw new Error("Method not implemented.");
	}
}
