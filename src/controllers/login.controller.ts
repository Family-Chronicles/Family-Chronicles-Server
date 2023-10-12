import { IController } from "../interfaces/controller.interface";
import ConfigService from "../services/config.srvs";
import DatabaseService from "../services/database.srvs";
import { Config } from "../types/config.type";
import { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ErrorResult from "../models/actionResults/error.result";
import User from "../models/user.model";
import Ok from "../models/actionResults/ok.result";
import "dotenv/config";

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
	private _config = ConfigService.getInstance().config as Config;
	private _database = DatabaseService.getInstance();

	public routes(app: Express): void {
		/**
		 * GET /login
		 * @summary	This returns the auth token
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "token": "TOKEN",
		 * }
		 */
		app.get("/login", (req: Request, res: Response) => {
			this.login(req, res);
		});

		/**
		 * POST /register
		 * @summary	This creates a new user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "message": "User created successfully",
		 * }
		 */
		app.post("/register", (req: Request, res: Response) => {
			this.register(req, res);
		});

		/**
		 * PUT /updateAccount
		 * @summary	This updates a user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *  "message": "User updated successfully",
		 * }
		 */
		app.put("/updateAccount", (req: Request, res: Response) => {
			this.updateAccount(req, res);
		});
	}

	private login(req: Request, res: Response): void {
		const { username, password } = req.body;
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
				if (!this.comparePassword(password, user.Password)) {
					res.status(400).send(
						new ErrorResult(400, "Wrong password")
					);
					return;
				}
				const token = this.generateToken({ username });
				res.send({ token });
			})
			.catch((err) => {
				res.status(500).send(new ErrorResult(500, err.message));
			});
	}

	private register(req: Request, res: Response): void {
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
				const hashedPassword = this.hashPassword(body.Password);
				const newUser = new User(
					null,
					body.Name,
					body.Email,
					hashedPassword,
					new Date(),
					new Date(),
					"Viewer"
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
				const hashedPassword = this.hashPassword(body.Password);
				const newUser = new User(
					body.Id || null,
					body.Name || user.Name,
					body.Email || user.Email,
					hashedPassword || user.Password,
					user.CreatedAt,
					new Date(),
					body.Role || user.Role
				);
				this._database
					.addUser(newUser)
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

	private hashPassword(password: string): string {
		const salt = bcrypt.genSaltSync(10);
		return bcrypt.hashSync(password, salt);
	}

	private comparePassword(password: string, hash: string): boolean {
		return bcrypt.compareSync(password, hash);
	}

	private generateToken(payload: any): string {
		let token = this._config.auth.secret;

		if (!token || token === "" || token === "TOKEN_SECRET") {
			token = process.env.SECRET as string;
		}

		return jwt.sign(payload, token, {
			expiresIn: this._config.auth.expiresIn,
		});
	}
}
