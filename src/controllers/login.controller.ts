import { IController } from "../interfaces/controller.interface";
import DatabaseService from "../services/database.srvs";
import { Express, Request, Response } from "express";
import crypto from "crypto";
import NodeRSA from "node-rsa";
import ErrorResult from "../models/actionResults/error.result";
import User from "../models/user.model";
import Ok from "../models/actionResults/ok.result";
import "dotenv/config";
import AuthorizationService from "../services/auth.srvs";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum";
import { RoleEnum } from "../enums/role.enum";
import ConfigService from "../services/config.srvs";

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
		app.get("/user/login", (req: Request, res: Response) => {
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
		app.post("/user/register", (req: Request, res: Response) => {
			this.register(req, res);
		});

		/**
		 * PUT /user/update
		 * @summary	This updates a user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "message": "User updated successfully",
		 * }
		 */
		app.put("/user/update", (req: Request, res: Response) => {
			this.updateAccount(req, res);
		});

		app.delete("/user/logout", (req: Request, res: Response) => {
			this.logout(req, res);
		});
	}

	private login(req: Request, res: Response): void {
		const { username, password } = req.body;
		const key = new NodeRSA(this._config.config.auth.privateKey);

		if (!username || !password) {
			res.status(400).send("Missing username or password");
			return;
		}
		// eslint-disable-next-line no-unused-vars
		this._database
			.getUserByUsername(username)
			.then((user: User | null) => {
				if (!user) {
					res.status(400).send(
						new ErrorResult(400, "User not found")
					);
					return;
				}
				if (
					!this._authorization.comparePassword(
						key.decrypt(password, "utf8"),
						user.Password
					)
				) {
					res.status(400).send(
						new ErrorResult(400, "Wrong password")
					);
					return;
				}

				if (user.Locked) {
					res.status(401).send(
						new ErrorResult(401, "User is locked")
					);
					return;
				}

				user.SessoionID = crypto.randomUUID();

				const token = this._authorization.generateToken(user);
				res.send(new Ok(token));
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}

	private register(req: Request, res: Response): void {
		const key = new NodeRSA(this._config.config.auth.privateKey);
		const body: User = req.body;
		if (!body.Name || !body.Password) {
			res.status(400).send(
				new ErrorResult(400, "Missing username or password")
			);
			return;
		}
		// eslint-disable-next-line no-unused-vars
		this._database
			.getUserByUsername(body.Name)
			.then((user: User | null) => {
				if (user) {
					res.status(400).send(
						new ErrorResult(400, "User already exists")
					);
					return;
				}
				const hashedPassword = this._authorization.hashPassword(
					key.decrypt(body.Password, "utf8")
				);
				const newUser = new User(
					null,
					body.Name,
					body.Email,
					hashedPassword,
					new Date(),
					new Date(),
					RoleEnum.UNAUTHORIZED,
					false,
					undefined
				);
				this._database
					.addUser(newUser)
					.then(() => {
						res.send(new Ok("User created successfully"));
					})
					.catch((err) => {
						res.status(500).send(new ErrorResult(500, err.message));
					});
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}

	private updateAccount(req: Request, res: Response): void {
		const key = new NodeRSA(this._config.config.auth.privateKey);
		const body: User = req.body;
		if (!body.Name || !body.Password) {
			res.status(400).send(
				new ErrorResult(400, "Missing username or password")
			);
			return;
		}
		// eslint-disable-next-line no-unused-vars
		this._database
			.getUserByUsername(body.Name)
			.then((user: User | null) => {
				if (!user) {
					res.status(400).send(
						new ErrorResult(400, "User not found")
					);
					return;
				}
				const hashedPassword = key.decrypt(
					this._authorization.hashPassword(body.Password),
					"utf8"
				);
				const newUser = new User(
					body.Id || null,
					body.Name || user.Name,
					body.Email || user.Email,
					hashedPassword || user.Password,
					user.CreatedAt,
					new Date(),
					user.Role,
					user.Locked,
					user.SessoionID
				);

				if (body.Role !== user.Role || body.Locked !== user.Locked) {
					if (user.Role !== RoleEnum.ADMIN) {
						res.status(401).send(
							new ErrorResult(401, "Unauthorized")
						);
						return;
					} else {
						newUser.Role = body.Role;
						newUser.Locked = body.Locked;
					}
				}

				this._database
					.updateDocument<User>(
						this._collectionName,
						{ Id: newUser.Id },
						newUser
					)
					.then(() => {
						res.send(new Ok("User updated successfully"));
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
			res.status(500).send(
				new ErrorResult(500, "Failed to authenticate token.")
			);
			return;
		}

		this._database
			.getUserByUsername(decoded.Name)
			.then((user: User | null) => {
				if (!user) {
					res.status(404).send(
						new ErrorResult(404, "No user found.")
					);
					return;
				}

				if (user.Password !== decoded.Password) {
					res.status(401).send(
						new ErrorResult(401, "Invalid password.")
					);
					return;
				}

				user.SessoionID = undefined;

				this._database
					.updateDocument<User>(
						this._collectionName,
						{ Id: user.Id },
						user
					)
					.then(() => {
						res.send(new Ok("User logged out successfully"));
					})
					.catch((err) => {
						res.status(500).send(new ErrorResult(500, err.message));
					});
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}
}
