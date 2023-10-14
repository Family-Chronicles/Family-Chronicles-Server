import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ConfigService from "./config.srvs";
import { Config } from "../types/config.type";
import User from "../models/user.model";
import ErrorResult from "../models/actionResults/error.result";
import DatabaseService from "./database.srvs";
import { RoleEnum } from "../enums/role.enum";

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
	private _config = ConfigService.getInstance().config as Config;
	private _database = DatabaseService.getInstance();

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

		const decoded = this.decodeToken<User>(
			token as unknown as string
		) as User | null;

		if (!decoded || decoded === null) {
			return res.status(500).send(
				new ErrorResult(
					500,
					JSON.stringify({
						auth: false,
						message: "Failed to authenticate token.",
					})
				)
			);
		}

		const user = await this._database.getUserByUsername(decoded.Name);

		if (!user) {
			return res.status(404).send(
				new ErrorResult(
					404,
					JSON.stringify({
						auth: false,
						message: "No user found.",
					})
				)
			);
		}

		if (user.Password !== decoded.Password) {
			return res.status(401).send(
				new ErrorResult(
					401,
					JSON.stringify({
						auth: false,
						message: "Invalid password.",
					})
				)
			);
		}

		if (user.SessoionID !== decoded.SessoionID) {
			return res.status(401).send(
				new ErrorResult(
					401,
					JSON.stringify({
						auth: false,
						message: "Invalid session.",
					})
				)
			);
		}

		if (user.Role === RoleEnum.UNAUTHORIZED) {
			return res.status(401).send(
				new ErrorResult(
					401,
					JSON.stringify({
						auth: false,
						message: "Unauthorized.",
					})
				)
			);
		}

		next();
	}

	public decodeToken<T>(token: string): string | JwtPayload | null | T {
		let secret = this._config.auth.secret;

		if (!secret || secret === "" || secret === "TOKEN_SECRET") {
			secret = process.env.SECRET as string;
		}

		return jwt.verify(token, process.env.SECRET as string) as T;
	}

	public generateToken(payload: string | object | Buffer): string {
		let secret = this._config.auth.secret;

		if (!secret || secret === "" || secret === "TOKEN_SECRET") {
			secret = process.env.SECRET as string;
		}

		return jwt.sign(payload, secret, {
			expiresIn: this._config.auth.expiresIn,
		});
	}
}
