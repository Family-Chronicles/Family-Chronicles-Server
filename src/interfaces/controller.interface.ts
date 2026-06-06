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
export interface IController {
	routes(_app: Express): void;
}
