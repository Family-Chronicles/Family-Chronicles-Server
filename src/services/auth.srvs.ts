import { Request, Response } from "express";

export class AuthorizationService {

	private static _instance: AuthorizationService;

	private readonly _token: string = "token";

	private constructor() {}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AuthorizationService();
		}
		return this._instance;
	}

	public async authorize(req: Request, res: Response, next: () => void) {
		const token = req.headers["x-access-token"];
		if (!token) {
			return res.status(401).send({ auth: false, message: "No token provided." });
		}

		const decoded = this.verifyToken(token as string);

		if (!decoded) {
			return res.status(500).send({ auth: false, message: "Failed to authenticate token." });
		}

		next();
	}

	private verifyToken(token: string): boolean {
		return token === this._token;
	}
}
