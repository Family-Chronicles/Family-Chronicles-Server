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
export default class AuthorizationService {
	private static _instance: AuthorizationService;

	private readonly _token: string =
		"Bearer cc092ff1-7650-4514-8c4f-73eeff3ed943";

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
		return token === this._token;
	}
}
