import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { RoleEnum } from "../enums/role.enum";
import ErrorResult from "../models/actionResults/error.result";
import FailedAttemptModel from "../models/failedAttempts.model";
import User from "../models/user.model";
import ConfigService from "./config.srvs";
import DatabaseService from "./database.srvs";

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
	/**
	 * Erstellt eine neue SessionID für einen User und speichert sie
	 */
	public async createSession(user: User): Promise<string> {
		const sessionID = crypto.randomUUID();
		user.SessoionID = sessionID;
		await this._database.updateDocument<User>(
			"users",
			{ Id: user.Id },
			user
		);
		return sessionID;
	}

	/**
	 * Löscht die SessionID eines Users (Logout)
	 */
	public async destroySession(user: User): Promise<void> {
		user.SessoionID = undefined;
		await this._database.updateDocument<User>(
			"users",
			{ Id: user.Id },
			user
		);
	}

	/**
	 * Prüft, ob die Session gültig ist (optional: Timeout)
	 */
	public async isSessionValid(
		user: User,
		sessionID: string
	): Promise<boolean> {
		if (!user.SessoionID || user.SessoionID !== sessionID) return false;
		// Optional: Timeout-Logik ergänzen
		return true;
	}

	/**
	 * Setzt die Session zurück (z.B. nach Passwort-Änderung)
	 */
	public async resetSession(user: User): Promise<string> {
		return await this.createSession(user);
	}
	private static _instance: AuthorizationService;
	private _config = ConfigService.getInstance().config;
	private _database = DatabaseService.getInstance();
	private _failedAttempts: FailedAttemptModel[] = [];

	private constructor() {
		this._database
			.listAllDocuments<FailedAttemptModel>("failedAttempts")
			.then((failedAttempts) => {
				this._failedAttempts = failedAttempts;
			});
	}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AuthorizationService();
		}
		return this._instance;
	}

	public hashPassword(password: string): string {
		const salt = bcrypt.genSaltSync(10);
		return bcrypt.hashSync(password, salt);
	}

	public comparePassword(password: string, hash: string): boolean {
		return bcrypt.compareSync(password, hash);
	}

	public async authorize(req: Request, res: Response, next: () => void) {
		const token = req.headers["authorization"];
		if (!token) {
			return res
				.status(401)
				.send(new ErrorResult(401, "No token provided."));
		}

		const decoded = this.decodeToken<User>(token as string) as User | null;
		if (!decoded) {
			return res
				.status(500)
				.send(new ErrorResult(500, "Failed to authenticate token."));
		}

		const user = await this._database.getUserByUsername(decoded.Name);
		if (!user) {
			await this.addFailedAttempt(decoded.Id, req.ip!);
			return res.status(404).send(new ErrorResult(404, "No user found."));
		}

		if (user.Password !== decoded.Password) {
			await this.addFailedAttempt(decoded.Id, req.ip!);
			return res
				.status(401)
				.send(new ErrorResult(401, "Invalid password."));
		}

		if (user.SessoionID !== decoded.SessoionID) {
			await this.addFailedAttempt(decoded.Id, req.ip!);
			return res
				.status(401)
				.send(new ErrorResult(401, "Invalid session."));
		}

		if (user.Role === RoleEnum.UNAUTHORIZED) {
			return res.status(401).send(new ErrorResult(401, "Unauthorized."));
		}

		next();
	}

	public decodeToken<T>(token: string): string | JwtPayload | null | T {
		let secret = this._config.auth.privateKey;
		if (!secret || secret === "") {
			secret = process.env.SECRET as string;
		}
		return jwt.verify(token, secret as Secret) as T;
	}

	public generateToken(payload: string | object | Buffer): string {
		let secret = this._config.auth.privateKey;
		if (!secret || secret === "") {
			secret = process.env.SECRET as string;
		}
		// @ts-ignore: Typdefinitionen von jsonwebtoken stimmen nicht mit der Praxis überein
		return jwt.sign(payload, secret, {
			expiresIn: this._config.auth.tokenExpiration,
			algorithm: "HS256",
		});
	}

	public async addFailedAttempt(userId: string, ip: string): Promise<void> {
		const failedAttempt = this._failedAttempts.find(
			(fa) => fa.UserId === userId
		);
		if (failedAttempt) {
			failedAttempt.Attempts++;
			failedAttempt.LastAttempt = new Date();
			failedAttempt.FailedIPs.push(ip);
			await this._database.updateDocument<FailedAttemptModel>(
				"failedAttempts",
				{ Id: failedAttempt.Id },
				failedAttempt
			);
		} else {
			const newFailedAttempt = new FailedAttemptModel(
				null,
				userId,
				1,
				new Date(),
				[ip]
			);
			await this._database.createDocument<FailedAttemptModel>(
				"failedAttempts",
				newFailedAttempt
			);
		}
	}

	public async syncFailedAttempts(): Promise<void> {
		this._failedAttempts =
			await this._database.listAllDocuments<FailedAttemptModel>(
				"failedAttempts"
			);
	}

	public async resetFailedAttempts(userId: string): Promise<void> {
		const failedAttempt = this._failedAttempts.find(
			(fa) => fa.UserId === userId
		);
		if (failedAttempt) {
			failedAttempt.Attempts = 0;
			failedAttempt.LastAttempt = new Date();
			failedAttempt.FailedIPs = [];
			await this._database.updateDocument<FailedAttemptModel>(
				"failedAttempts",
				{ Id: failedAttempt.Id },
				failedAttempt
			);
		}
	}

	public async lockUser(userId: string): Promise<void> {
		const user = await this._database.getUserById(userId);
		if (user) {
			user.Locked = true;
			await this._database.updateDocument<User>(
				"users",
				{ Id: user.Id },
				user
			);
		}
	}

	/**
	 * Prüft, ob der aktuelle User die geforderte Rolle besitzt
	 */
	public async requireRole(
		req: Request,
		res: Response,
		next: () => void,
		allowedRoles: string[]
	) {
		const token = req.headers["authorization"];
		if (!token) {
			return res
				.status(401)
				.send(new ErrorResult(401, "No token provided."));
		}
		const decoded = this.decodeToken<any>(token as string);
		if (!decoded || !decoded.Name) {
			return res.status(401).send(new ErrorResult(401, "Invalid token."));
		}
		const user = await this._database.getUserByUsername(decoded.Name);
		if (!user) {
			return res.status(404).send(new ErrorResult(404, "No user found."));
		}
		if (!allowedRoles.includes(user.Role)) {
			return res
				.status(403)
				.send(new ErrorResult(403, "Insufficient permissions."));
		}
		next();
	}
}
