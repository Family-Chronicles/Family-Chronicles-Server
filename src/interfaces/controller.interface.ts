import { Express } from "express";
export abstract class IController {
	// eslint-disable-next-line no-unused-vars
	public static routes(app: Express): void {
		throw new Error("Method not implemented.");
	}
}
