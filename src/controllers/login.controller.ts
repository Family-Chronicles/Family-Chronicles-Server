import "dotenv/config";
import { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { getClientIP, SecurityConstants } from "../config/security.constants";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum";
import { RoleEnum } from "../enums/role.enum";
import { IController } from "../interfaces/controller.interface";
import ErrorResult from "../models/actionResults/error.result";
import Ok from "../models/actionResults/ok.result";
import User from "../models/user.model";
import AuthorizationService from "../services/auth.srvs";
import ConfigService from "../services/config.srvs";
import DatabaseService from "../services/database.srvs";
import {
	decryptAndValidatePassword,
	decryptPasswordOnly,
} from "../utils/password.utils";

/**
 * Login controller
 * @class
 * @implements {IController}
 * @property {Config} _config - Config
 * @property {DatabaseService} _database - Database service
 * @constructor
 * @returns {LoginController} - Login controller instance
 * @example
 * const loginController = new LoginController();
 */
export default class LoginController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = DatabaseCollectionEnum.USERS;
	private _config = ConfigService.getInstance();
	private _registerLimiter = rateLimit({
		windowMs: 60 * 60 * 1000,
		max: 5,
		standardHeaders: true,
		legacyHeaders: false,
		message: new ErrorResult(
			429,
			"Too many registration attempts. Please try again later."
		),
	});

	public routes(app: Express): void {
		/**
		 * GET /user/login
		 * @summary	This returns the auth token
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "token": "TOKEN",
		 * }
		 */
		app.post("/user/login", (req: Request, res: Response) => {
			this.login(req, res);
		});

		/**
		 * POST /user/register
		 * @summary	This creates a new user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "message": "User created successfully",
		 * }
		 */
		app.post(
			"/user/register",
			this._registerLimiter,
			(req: Request, res: Response) => {
				this.register(req, res);
			}
		);

		/**
		 * PUT /user/update
		 * @summary	This updates a user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "message": "User updated successfully",
		 * }
		 */
		app.put(
			"/user/update",
			this._authorization.authorize.bind(this._authorization),
			(req: Request, res: Response) => {
				this.updateAccount(req, res);
			}
		);

		app.delete(
			"/user/logout",
			this._authorization.authorize.bind(this._authorization),
			(req: Request, res: Response) => {
				this.logout(req, res);
			}
		);
	}

	private async login(req: Request, res: Response): Promise<void> {
		const { username, password } = req.body;
		const clientIP = getClientIP(req);

		if (!username || !password) {
			res.status(400).send(
				new ErrorResult(400, "Missing username or password")
			);
			return;
		}

		try {
			const user = await this._database.getUserByUsername(username);

			if (!user) {
				// Verzögerung um Timing-Attacken zu erschweren
				await SecurityConstants.delay();
				res.status(400).send(
					new ErrorResult(400, "Invalid credentials")
				);
				return;
			}

			// Prüfe ob User gesperrt ist
			if (user.Locked) {
				await SecurityConstants.delay();
				res.status(401).send(
					new ErrorResult(401, "Invalid credentials")
				);
				return;
			}

			// Prüfe fehlgeschlagene Versuche
			const isLocked =
				await this._authorization.isAccountTemporarilyLocked(
					user.Id,
					SecurityConstants.MAX_LOGIN_ATTEMPTS,
					SecurityConstants.LOCKOUT_DURATION_MS
				);

			if (isLocked) {
				await SecurityConstants.delay();
				res.status(429).send(
					new ErrorResult(
						429,
						"Too many failed attempts. Please try again later."
					)
				);
				return;
			}

			// Passwort entschlüsseln (ohne Stärke-Validierung beim Login)
			const decryptResult = decryptPasswordOnly(
				password,
				this._config.config.auth.privateKey
			);
			if (!decryptResult.success) {
				await SecurityConstants.delay();
				res.status(decryptResult.error!.code).send(
					new ErrorResult(
						decryptResult.error!.code,
						decryptResult.error!.message
					)
				);
				return;
			}
			const decryptedPassword = decryptResult.password!;

			const passwordMatch = this._authorization.comparePassword(
				decryptedPassword,
				user.Password
			);

			if (!passwordMatch) {
				// Fehlgeschlagenen Versuch protokollieren
				await this._authorization.addFailedAttempt(user.Id, clientIP);

				// Prüfen ob nach diesem Versuch gesperrt werden sollte
				const shouldLock = await this._authorization.shouldLockAccount(
					user.Id,
					SecurityConstants.MAX_LOGIN_ATTEMPTS
				);
				if (shouldLock) {
					await this._authorization.lockUser(user.Id);
				}

				await SecurityConstants.delay();

				res.status(401).send(
					new ErrorResult(401, "Invalid credentials")
				);
				return;
			}

			// Bei erfolgreichem Login: Fehlversuche zurücksetzen
			await this._authorization.resetFailedAttempts(user.Id);

			// Session generieren und speichern
			await this._authorization.createSession(user);
			const token = this._authorization.generateToken(user);
			res.send({ token });
		} catch (err: any) {
			console.error("Login error:", err);
			res.status(500).send(new ErrorResult(500, "Internal server error"));
		}
	}

	private async register(req: Request, res: Response): Promise<void> {
		const body: User = req.body;
		if (!body.Name || !body.Password) {
			res.status(400).send(
				new ErrorResult(400, "Missing username or password")
			);
			return;
		}

		const normalizedEmail = body.Email?.trim().toLowerCase();

		// Username-Validierung: Nur alphanumerische Zeichen und Unterstriche, 3-50 Zeichen
		const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
		if (!usernameRegex.test(body.Name)) {
			res.status(400).send(
				new ErrorResult(
					400,
					"Username must be 3-50 characters and contain only letters, numbers, and underscores"
				)
			);
			return;
		}

		// E-Mail-Validierung (optional aber empfohlen)
		if (body.Email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(normalizedEmail ?? "")) {
				res.status(400).send(
					new ErrorResult(400, "Invalid email format")
				);
				return;
			}
		}

		// Passwort entschlüsseln und validieren
		const decryptResult = decryptAndValidatePassword(
			body.Password,
			this._config.config.auth.privateKey
		);
		if (!decryptResult.success) {
			res.status(decryptResult.error!.code).send(
				new ErrorResult(
					decryptResult.error!.code,
					decryptResult.error!.message
				)
			);
			return;
		}
		const decryptedPassword = decryptResult.password!;

		try {
			const existingUser = await this._database.getUserByUsername(
				body.Name
			);
			if (existingUser) {
				res.status(400).send(
					new ErrorResult(400, "User already exists")
				);
				return;
			}

			if (normalizedEmail) {
				const existingEmailUser = await this._database.getUserByEmail(
					normalizedEmail
				);
				if (existingEmailUser) {
					res.status(400).send(
						new ErrorResult(400, "Email address already in use")
					);
					return;
				}
			}

			const hashedPassword =
				this._authorization.hashPassword(decryptedPassword);
			const newUser = new User(
				null,
				body.Name,
				normalizedEmail ?? body.Email,
				hashedPassword,
				new Date(),
				new Date(),
				RoleEnum.UNAUTHORIZED,
				false,
				undefined
			);

			await this._database.addUser(newUser);
			res.send(new Ok("User created successfully"));
		} catch (err: any) {
			res.status(500).send(new ErrorResult(500, err.message));
		}
	}

	private async updateAccount(req: Request, res: Response): Promise<void> {
		const body: User = req.body;
		if (!body.Name) {
			res.status(400).send(new ErrorResult(400, "Missing username"));
			return;
		}

		// Authentifizierten Benutzer aus Token extrahieren
		const token = req.headers["authorization"];
		const requestingUser = this._authorization.decodeToken<User>(
			token as string
		);
		if (!requestingUser) {
			res.status(401).send(new ErrorResult(401, "Invalid token"));
			return;
		}

		// Den authentifizierten Benutzer aus der DB holen für aktuelle Rolle
		const authenticatedUser = await this._database.getUserByUsername(
			requestingUser.Name
		);
		if (!authenticatedUser) {
			res.status(401).send(
				new ErrorResult(401, "Authenticated user not found")
			);
			return;
		}

		this._database
			.getUserByUsername(body.Name)
			.then(async (user: User | null) => {
				if (!user) {
					res.status(400).send(
						new ErrorResult(400, "User not found")
					);
					return;
				}

				// Benutzer darf nur sein eigenes Konto bearbeiten, außer Admin
				if (
					authenticatedUser.Name !== user.Name &&
					authenticatedUser.Role !== RoleEnum.ADMIN
				) {
					res.status(403).send(
						new ErrorResult(
							403,
							"You can only update your own account"
						)
					);
					return;
				}

				// Passwort nur aktualisieren wenn es im Body enthalten ist
				const normalizedEmail = body.Email?.trim().toLowerCase();
				if (normalizedEmail && normalizedEmail !== user.Email) {
					const existingEmailUser =
						await this._database.getUserByEmail(normalizedEmail);
					if (existingEmailUser && existingEmailUser.Id !== user.Id) {
						res.status(400).send(
							new ErrorResult(400, "Email address already in use")
						);
						return;
					}
				}

				// Passwort nur aktualisieren wenn es im Body enthalten ist
				let hashedPassword = user.Password;
				const passwordChanged = Boolean(body.Password);
				if (body.Password) {
					// Passwort entschlüsseln und validieren
					const decryptResult = decryptAndValidatePassword(
						body.Password,
						this._config.config.auth.privateKey
					);
					if (!decryptResult.success) {
						res.status(decryptResult.error!.code).send(
							new ErrorResult(
								decryptResult.error!.code,
								decryptResult.error!.message
							)
						);
						return;
					}

					hashedPassword = this._authorization.hashPassword(
						decryptResult.password!
					);
				}

				const updatedUser = new User(
					user.Id,
					body.Name || user.Name,
					normalizedEmail || user.Email,
					hashedPassword,
					user.CreatedAt,
					new Date(),
					user.Role,
					user.Locked,
					passwordChanged ? undefined : user.SessionID,
					passwordChanged ? undefined : user.SessionCreatedAt
				);

				// Rolle und Lock-Status nur durch Admin änderbar - prüfe authentifizierten User!
				if (body.Role !== undefined && body.Role !== user.Role) {
					if (authenticatedUser.Role !== RoleEnum.ADMIN) {
						res.status(403).send(
							new ErrorResult(
								403,
								"Insufficient permissions to change role"
							)
						);
						return;
					}
					(updatedUser as any).Role = body.Role;
				}

				if (body.Locked !== undefined && body.Locked !== user.Locked) {
					if (authenticatedUser.Role !== RoleEnum.ADMIN) {
						res.status(403).send(
							new ErrorResult(
								403,
								"Insufficient permissions to change lock status"
							)
						);
						return;
					}
					(updatedUser as any).Locked = body.Locked;
				}

				this._database
					.updateDocument<User>(
						this._collectionName,
						{ Id: updatedUser.Id },
						updatedUser
					)
					.then(() => {
						res.send(
							new Ok(
								passwordChanged
									? "Password updated successfully. Please log in again."
									: "User updated successfully"
							)
						);
					})
					.catch((err) => {
						res.status(500).send(new ErrorResult(500, err.message));
					});
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}

	private logout(req: Request, res: Response): void {
		const token = req.headers["authorization"];
		if (
			token === undefined ||
			token === null ||
			token === "" ||
			token.length <= 0
		) {
			res.status(401).send({
				auth: false,
				message: "No token provided.",
			});
			return;
		}

		const decoded = this._authorization.decodeToken<User>(
			token as unknown as string
		) as User | null;

		if (!decoded || decoded === null) {
			res.status(401).send(
				new ErrorResult(401, "Failed to authenticate token.")
			);
			return;
		}

		this._database
			.getUserByUsername(decoded.Name)
			.then(async (user: User | null) => {
				if (!user) {
					res.status(404).send(
						new ErrorResult(404, "No user found.")
					);
					return;
				}

				// Validiere Session statt Password (Password ist nicht im Token)
				if (!user.SessionID || user.SessionID !== decoded.SessionID) {
					res.status(401).send(
						new ErrorResult(401, "Invalid session.")
					);
					return;
				}

				// Session entfernen
				await this._authorization.destroySession(user);
				res.send(new Ok("User logged out successfully"));
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}
}
