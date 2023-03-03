import { Express, Request, Response } from "express";
import { IRoute } from "../interfaces/route.interface";


export class TestRoute implements IRoute {
	public static route(app: Express): void {
		/**
		 * @swagger
		 * /test:
		 * 		get:
		 * 			summary: Returns a test string
		 * 			description: Returns a test string
		 **/
		app.get("/test", (req: Request, res: Response) => {
			res.send("Test");
		});
	}
}
