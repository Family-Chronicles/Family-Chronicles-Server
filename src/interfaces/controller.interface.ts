import { Express } from "express";
export abstract class IController {
	public static routes(app: Express): void {}
}
