import { Express } from "express";
export abstract class IRoute {
	public static route(app: Express): void {}
}
