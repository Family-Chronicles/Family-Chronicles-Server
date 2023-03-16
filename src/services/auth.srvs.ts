import { Request, Response } from "express";

/**
 * Authorization service
 * @class
 * @property {Function} authorize - Authorize request
 * @example
 * const authService = AuthorizationService.getInstance();
 * authService.authorize(req, res, () => {
 * 	// Do something
 * });
 */
export class AuthorizationService {
	private static _instance: AuthorizationService;

	private readonly _token: string = "Bearer token";

	private constructor() {}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AuthorizationService();
		}
		return this._instance;
	}

	public async authorize(req: Request, res: Response, next: () => void) {
		const token = req.headers["Authorization"];
		if (!token) {
			return res
				.status(401)
				.send({ auth: false, message: "No token provided." });
		}

		const decoded = this.verifyToken(token as string);

		if (!decoded) {
			return res
				.status(500)
				.send({ auth: false, message: "Failed to authenticate token." });
		}

		next();
	}

	private verifyToken(token: string): boolean {
		return token === this._token;
	}
}
