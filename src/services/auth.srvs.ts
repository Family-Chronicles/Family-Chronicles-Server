import { Request, Response } from "express";
import jwt from "jsonwebtoken";

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
export default class AuthorizationService {
	private static _instance: AuthorizationService;

	private constructor() {}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AuthorizationService();
		}
		return this._instance;
	}

	public async authorize(req: Request, res: Response, next: () => void) {
		const token = req.headers["authorization"];
		if (
			token === undefined ||
			token === null ||
			token === "" ||
			token.length <= 0
		) {
			return res.status(401).send({
				auth: false,
				message: "No token provided.",
			});
		}

		const decoded = this.verifyToken(token as unknown as string);

		if (!decoded) {
			return res.status(500).send({
				auth: false,
				message: "Failed to authenticate token.",
			});
		}

		next();
	}

	private verifyToken(token: string): boolean {
		try {
			const decoded = jwt.verify(token, process.env.SECRET as string);
			return decoded !== undefined;
		} catch (error) {
			return false;
		}
	}
}
