import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import DatabaseService from "../services/database.srvs.js";
import User from "../models/user.model.js";
import AuthorizationService from "../services/auth.srvs.js";
import bodyParser from "body-parser";
import ErrorResult from "../models/actionResults/error.result.js";
import Ok from "../models/actionResults/ok.result.js";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum.js";

export default class UserController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = DatabaseCollectionEnum.USERS;
	/**
	 * Routes user controller
	 * @param app
	 */
	public routes(app: Express): void {
		/**
		 * GET /users
		 * @tags users
		 * @summary This returns an array of all users
		 * @security BearerAuth
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"userType": "UserType"
		 * 	},
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"userType": "UserType"
		 * 	}
		 * ]
		 * @example response - 400 - bad request response example
		 * {
		 * 	"status": 400
		 * }
		 * @example response - 401 - unauthorized response example
		 * {
		 * 	"status": 401
		 * }
		 * @example response - 403 - forbidden response example
		 * {
		 * 	"status": 403
		 * }
		 * @example response - 404 - not found response example
		 * {
		 * 	"status": 404
		 * }
		 * @example response - 500 - internal server error response example
		 * {
		 * 	"status": 500
		 * }
		 * @example response - 503 - service unavailable response example
		 * {
		 * 	"status": 503
		 * }
		 */
		app.get("/users", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.index(req, res);
			});
		});

		/**
		 * GET /user/:id
		 * @tags users
		 * @summary This returns a user by id
		 * @security BearerAuth
		 * @param {string} id.path.required - the id of the user
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"userType": "UserType"
		 * 	}
		 * @example response - 400 - bad request response example
		 * {
		 * 	"status": 400
		 * }
		 * @example response - 401 - unauthorized response example
		 * {
		 * 	"status": 401
		 * }
		 * @example response - 403 - forbidden response example
		 * {
		 * 	"status": 403
		 * }
		 * @example response - 404 - not found response example
		 * {
		 * 	"status": 404
		 * }
		 * @example response - 500 - internal server error response example
		 * {
		 * 	"status": 500
		 * }
		 * @example response - 503 - service unavailable response example
		 * {
		 * 	"status": 503
		 * }
		 */
		app.get("/user/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.show(req, res);
			});
		});

		/**
		 * POST /user
		 * @tags users
		 * @summary This a new user and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new user - application/json
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"name": "string",
		 * 		"email": "string",
		 * 		"password": "string",
		 * 		"role": "Date",
		 * 	}
		 * @example response - 400 - bad request response example
		 * {
		 * 	"status": 400
		 * }
		 * @example response - 401 - unauthorized response example
		 * {
		 * 	"status": 401
		 * }
		 * @example response - 403 - forbidden response example
		 * {
		 * 	"status": 403
		 * }
		 * @example response - 404 - not found response example
		 * {
		 * 	"status": 404
		 * }
		 * @example response - 500 - internal server error response example
		 * {
		 * 	"status": 500
		 * }
		 * @example response - 503 - service unavailable response example
		 * {
		 * 	"status": 503
		 * }
		 */
		app.post("/user", bodyParser.json(), (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.create(req, res);
			});
		});

		/**
		 * PUT /user/:id
		 * @tags users
		 * @summary This updates a user by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"userType": "UserType"
		 * 	}
		 * @example response - 400 - bad request response example
		 * {
		 * 	"status": 400
		 * }
		 * @example response - 401 - unauthorized response example
		 * {
		 * 	"status": 401
		 * }
		 * @example response - 403 - forbidden response example
		 * {
		 * 	"status": 403
		 * }
		 * @example response - 404 - not found response example
		 * {
		 * 	"status": 404
		 * }
		 * @example response - 500 - internal server error response example
		 * {
		 * 	"status": 500
		 * }
		 * @example response - 503 - service unavailable response example
		 * {
		 * 	"status": 503
		 * }
		 */
		app.put(
			"/user/:id",
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.update(req, res);
				});
			}
		);

		/**
		 * DELETE /user/:id
		 * @tags users
		 * @summary This deletes a user by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"success": true,
		 * 	}
		 * @example response - 400 - bad request response example
		 * {
		 * 	"status": 400
		 * }
		 * @example response - 401 - unauthorized response example
		 * {
		 * 	"status": 401
		 * }
		 * @example response - 403 - forbidden response example
		 * {
		 * 	"status": 403
		 * }
		 * @example response - 404 - not found response example
		 * {
		 * 	"status": 404
		 * }
		 * @example response - 500 - internal server error response example
		 * {
		 * 	"status": 500
		 * }
		 * @example response - 503 - service unavailable response example
		 * {
		 * 	"status": 503
		 * }
		 */
		app.delete("/user/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.delete(req, res);
			});
		});
	}

	private index(req: Request, res: Response): void {
		const userDocuments = this._database.listAllDocuments<User>(
			this._collectionName
		);

		userDocuments
			.then((users) => {
				if (users === null) {
					users = [];
				}

				users.forEach((user) => {
					//@ts-ignore
					delete user._id;
				});

				res.send(users);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private create(req: Request, res: Response): void {
		console.log(req.body);
		const user = new User(
			null,
			req.body.name,
			req.body.email,
			req.body.password,
			new Date(),
			new Date(),
			req.body.role
		);

		this._database
			.createDocument<User>(this._collectionName, user)
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500, message: error.message });
			});

		res.send(user);
	}

	private show(req: Request, res: Response): void {
		const userDocument = this._database.findDocument<User>(
			this._collectionName,
			req.params.id
		);

		userDocument
			.then((user) => {
				if (user === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				//@ts-ignore
				delete user!._id;
				res.send(user);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private update(req: Request, res: Response): void {
		const userDocument = this._database.findDocument<User>(
			this._collectionName,
			req.params.id
		);

		userDocument
			.then((user) => {
				if (user === null || user === undefined) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				const updatedUser = new User(
					user.Id,
					req.body.name ?? user.Name,
					req.body.email ?? user.Email,
					req.body.password ?? user.Password,
					user.CreatedAt,
					new Date(),
					req.body.role ?? user.Role
				);

				const result = JSON.stringify(updatedUser);

				this._database
					.updateDocument(
						this._collectionName,
						userDocument,
						updatedUser
					)
					.then(() => {
						res.status(200).send(result);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send(new ErrorResult(500));
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private delete(req: Request, res: Response): void {
		const userDocument = this._database.findDocument<User>(
			this._collectionName,
			req.path.split("/")[2]
		);

		userDocument
			.then((user) => {
				if (user === null || user === undefined) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				this._database
					.deleteDocument(this._collectionName, user)
					.then(() => {
						res.status(200).send(
							new Ok(
								`User ${user.Name} with id ${user.Id} deleted successfully`
							)
						);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send(new ErrorResult(500));
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}
}
