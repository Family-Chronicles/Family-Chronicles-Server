import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { getClientIP, SecurityConstants } from "../config/security.constants";
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
		user.SessionID = sessionID;
		user.SessionCreatedAt = new Date();
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
		user.SessionID = undefined;
		user.SessionCreatedAt = undefined;
		await this._database.updateDocument<User>(
			"users",
			{ Id: user.Id },
			user
		);
	}

	/**
	 * Prüft, ob die Session gültig ist inkl. Timeout
	 */
	public async isSessionValid(
		user: User,
		sessionID: string
	): Promise<boolean> {
		if (!user.SessionID || user.SessionID !== sessionID) return false;

		// Session-Timeout Prüfung
		if (user.SessionCreatedAt) {
			const sessionAge =
				Date.now() - new Date(user.SessionCreatedAt).getTime();
			const sessionTimeout = this._config.auth.sessionTimeout
				? this.parseTimeoutString(this._config.auth.sessionTimeout)
				: SecurityConstants.SESSION_TIMEOUT_MS;

			if (sessionAge > sessionTimeout) {
				// Session ist abgelaufen, automatisch zerstören
				await this.destroySession(user);
				return false;
			}
		}

		return true;
	}

	/**
	 * Parst einen Timeout-String (z.B. "1d", "2h") in Millisekunden
	 */
	private parseTimeoutString(timeout: string): number {
		const match = timeout.match(/^(\d+)([dhms])$/);
		if (!match) return SecurityConstants.SESSION_TIMEOUT_MS;

		const value = parseInt(match[1], 10);
		const unit = match[2];

		switch (unit) {
			case "d":
				return value * 24 * 60 * 60 * 1000;
			case "h":
				return value * 60 * 60 * 1000;
			case "m":
				return value * 60 * 1000;
			case "s":
				return value * 1000;
			default:
				return SecurityConstants.SESSION_TIMEOUT_MS;
		}
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

	private constructor() {}

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
				.status(401)
				.send(new ErrorResult(401, "Failed to authenticate token."));
		}

		const clientIP = getClientIP(req);
		const user = await this._database.getUserByUsername(decoded.Name);
		if (!user) {
			await this.addFailedAttempt(decoded.Id, clientIP);
			// Verzögerung gegen Timing-Attacken
			await SecurityConstants.delay();
			return res.status(404).send(new ErrorResult(404, "No user found."));
		}

		if (decoded.Role && decoded.Role !== user.Role) {
			return res
				.status(401)
				.send(
					new ErrorResult(401, "Token claims are no longer valid.")
				);
		}

		// Prüfe ob User gesperrt ist
		if (user.Locked) {
			return res
				.status(401)
				.send(
					new ErrorResult(
						401,
						"Account is locked. Please contact support."
					)
				);
		}

		// Session-Validierung inkl. Timeout-Prüfung
		const isValidSession = await this.isSessionValid(
			user,
			decoded.SessionID || ""
		);
		if (!isValidSession) {
			await this.addFailedAttempt(decoded.Id, clientIP);
			return res
				.status(401)
				.send(new ErrorResult(401, "Invalid or expired session."));
		}

		if (user.Role === RoleEnum.UNAUTHORIZED) {
			return res.status(401).send(new ErrorResult(401, "Unauthorized."));
		}

		next();
	}

	public decodeToken<T>(token: string): T | null {
		try {
			// Token ohne Bearer-Prefix
			const tokenValue = token.startsWith("Bearer ")
				? token.slice(7)
				: token;

			const decoded = jwt.verify(
				tokenValue,
				this._config.auth.jwtSecret as Secret,
				{
					algorithms: ["HS256"],
				}
			) as T;

			return decoded;
		} catch (err) {
			console.error("Token verification failed:", err);
			return null;
		}
	}

	public generateToken(payload: User): string {
		// Sensible Daten aus dem Token-Payload entfernen
		const sanitizedPayload = {
			Id: payload.Id,
			Name: payload.Name,
			Email: payload.Email,
			Role: payload.Role,
			SessionID: payload.SessionID,
		};

		return jwt.sign(sanitizedPayload, this._config.auth.jwtSecret, {
			expiresIn: this._config.auth.tokenExpiration || "1h",
			algorithm: "HS256",
		} as jwt.SignOptions);
	}

	public async addFailedAttempt(userId: string, ip: string): Promise<void> {
		const now = new Date();
		await this._database.updateDocumentWithOperators(
			"failedAttempts",
			{ UserId: userId },
			{
				$setOnInsert: {
					Id: crypto.randomUUID(),
					UserId: userId,
				},
				$inc: { Attempts: 1 },
				$set: { LastAttempt: now },
				$push: {
					FailedIPs: {
						$each: [ip],
						$slice: -SecurityConstants.MAX_FAILED_IPS,
					},
				},
			} as any,
			{ upsert: true }
		);
	}

	public async syncFailedAttempts(): Promise<void> {
		return;
	}

	public async resetFailedAttempts(userId: string): Promise<void> {
		await this._database.updateDocumentWithOperators(
			"failedAttempts",
			{ UserId: userId },
			{
				$set: {
					Attempts: 0,
					LastAttempt: new Date(),
					FailedIPs: [],
				},
			}
		);
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
	 * Prüft, ob ein Account temporär gesperrt ist (basierend auf Fehlversuchen)
	 */
	public async isAccountTemporarilyLocked(
		userId: string,
		maxAttempts: number,
		lockoutDuration: number
	): Promise<boolean> {
		const failedAttempt = await this.getFailedAttempt(userId);

		if (!failedAttempt) return false;

		if (failedAttempt.Attempts >= maxAttempts) {
			const timeSinceLastAttempt =
				Date.now() - new Date(failedAttempt.LastAttempt).getTime();

			// Wenn Lockout-Zeit noch nicht abgelaufen
			if (timeSinceLastAttempt < lockoutDuration) {
				return true;
			}

			// Lockout abgelaufen, Versuche zurücksetzen
			await this.resetFailedAttempts(userId);
		}

		return false;
	}

	/**
	 * Prüft, ob ein Account nach dem aktuellen Versuch gesperrt werden sollte
	 */
	public async shouldLockAccount(
		userId: string,
		maxAttempts: number
	): Promise<boolean> {
		const failedAttempt = await this.getFailedAttempt(userId);

		if (!failedAttempt) return false;

		// Bei zu vielen Versuchen Account dauerhaft sperren
		const permanentLockThreshold =
			maxAttempts * SecurityConstants.PERMANENT_LOCK_MULTIPLIER;
		return failedAttempt.Attempts >= permanentLockThreshold;
	}

	private async getFailedAttempt(
		userId: string
	): Promise<FailedAttemptModel | null> {
		return this._database.findOneByQuery<FailedAttemptModel>(
			"failedAttempts",
			{ UserId: userId }
		);
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
