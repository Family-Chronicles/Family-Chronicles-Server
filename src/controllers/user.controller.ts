import escapeHtml from "escape-html";
import { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import Paginator from "../classes/paginator";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum";
import { IController } from "../interfaces/controller.interface.js";
import ErrorResult from "../models/actionResults/error.result";
import Ok from "../models/actionResults/ok.result";
import User from "../models/user.model";
import AuthorizationService from "../services/auth.srvs";
import DatabaseService from "../services/database.srvs";

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
		 * @swagger
		 * components:
		 *   securitySchemes:
		 *     BearerAuth:
		 *       type: http
		 *       scheme: bearer
		 *       bearerFormat: JWT
		 *   schemas:
		 *     User:
		 *       type: object
		 *       properties:
		 *         Id:
		 *           type: string
		 *         Name:
		 *           type: string
		 *         Email:
		 *           type: string
		 *         Password:
		 *           type: string
		 *         CreatedAt:
		 *           type: string
		 *           format: date-time
		 *         UpdatedAt:
		 *           type: string
		 *           format: date-time
		 *         Role:
		 *           type: string
		 *           enum: [Admin, Editor, Viewer, Unauthorized]
		 *         SessoionID:
		 *           type: string
		 *         Locked:
		 *           type: boolean
		 *     AuthResponse:
		 *       type: object
		 *       properties:
		 *         token:
		 *           type: string
		 *         user:
		 *           $ref: '#/components/schemas/User'
		 *     ErrorResult:
		 *       type: object
		 *       properties:
		 *         status:
		 *           type: integer
		 *         message:
		 *           type: string
		 * security:
		 *   - BearerAuth: []
		 */
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
			this._authorization.requireRole(
				req,
				res,
				() => {
					this.index(req, res);
				},
				["Admin", "Editor", "Viewer"]
			);
		});

		/**
		 * GET /users/:pageSize/:page
		 * @tags users
		 * @summary This returns an array of all users paged
		 * @security BearerAuth
		 * @param {string} pageSize.path.required - the page size
		 * @param {string} page.path.required - the page
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
		app.get("/users/:pageSize/:page", (req: Request, res: Response) => {
			this._authorization.requireRole(
				req,
				res,
				() => {
					this.indexPaged(req, res);
				},
				["Admin", "Editor", "Viewer"]
			);
		});

		app.get("/users/pageCount/:pageSize", (req: Request, res: Response) => {
			this._authorization.requireRole(
				req,
				res,
				() => {
					this.getPageCount(req, res);
				},
				["Admin", "Editor", "Viewer"]
			);
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
		app.get(
			"/user/:id",
			[param("id").isString().withMessage("ID muss angegeben werden.")],
			(req: Request, res: Response) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.show(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

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
		app.post(
			"/user",
			[
				body("Name")
					.isString()
					.notEmpty()
					.withMessage("Name ist erforderlich."),
				body("Password")
					.isString()
					.notEmpty()
					.withMessage("Password ist erforderlich."),
				body("Email")
					.isEmail()
					.withMessage("Gültige Email ist erforderlich."),
				body("Role")
					.isString()
					.isIn(["Admin", "Editor", "Viewer", "Unauthorized"])
					.withMessage("Ungültige Rolle."),
			],
			(req: Request, res: Response) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.create(req, res);
					},
					["Admin"]
				);
			}
		);

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
			[
				param("id").isString().withMessage("ID muss angegeben werden."),
				body("Name").optional().isString(),
				body("Email").optional().isEmail(),
				body("Password").optional().isString(),
				body("Role")
					.optional()
					.isString()
					.isIn(["Admin", "Editor", "Viewer", "Unauthorized"]),
				body("Locked").optional().isBoolean(),
			],
			(req: Request, res: Response) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.update(req, res);
					},
					["Admin", "Editor"]
				);
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
		app.delete(
			"/user/:id",
			[param("id").isString().withMessage("ID muss angegeben werden.")],
			(req: Request, res: Response) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.delete(req, res);
					},
					["Admin"]
				);
			}
		);
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

	private indexPaged(req: Request, res: Response): void {
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

				const pageSize = parseInt(req.params.pageSize);
				const page = parseInt(req.params.page);

				const result = Paginator.paginate(users, pageSize, page);

				res.send(result);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private getPageCount(req: Request, res: Response): void {
		const userDocuments = this._database.listAllDocuments<User>(
			this._collectionName
		);

		userDocuments
			.then((users) => {
				if (users === null) {
					users = [];
				}

				users.forEach((family) => {
					//@ts-ignore
					delete family._id;
				});

				const pageSize = parseInt(req.params.pageSize);

				const result = Paginator.getPageCount<User>(users, pageSize);

				res.send({ pageCount: result });
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
			req.body.role,
			false,
			req.body.sessionID ?? undefined
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
					req.body.role ?? user.Role,
					req.body.locked ?? user.Locked,
					req.body.sessionID ?? user.SessoionID ?? undefined
				);

				const result = JSON.stringify(updatedUser);

				this._database
					.updateDocument(
						this._collectionName,
						userDocument,
						updatedUser
					)
					.then(() => {
						const sanitizedResult = escapeHtml(result);
						res.status(200).send(sanitizedResult);
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
