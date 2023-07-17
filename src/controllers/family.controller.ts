import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import { DatabaseService } from "../services/database.srvs.js";
import { Family } from "../models/family.model.js";
import { AuthorizationService } from "../services/auth.srvs.js";
import bodyParser from "body-parser";
import { RateLimitRequestHandler } from "express-rate-limit";

export class FamilyController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = "familys";
	/**
	 * Routes family controller
	 * @param app
	 */
	public routes(app: Express, rateLimiting: RateLimitRequestHandler): void {
		/**
		 * GET /familys
		 * @tags familys
		 * @summary This returns an array of all familys
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
		 * 		"familyType": "FamilyType"
		 * 	},
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"familyType": "FamilyType"
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
		app.get("/familys", rateLimiting, (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.index(req, res);
			});
		});

		/**
		 * GET /family/:id
		 * @tags familys
		 * @summary This returns a family by id
		 * @security BearerAuth
		 * @param {string} id.path.required - the id of the family
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"familyType": "FamilyType"
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
		app.get("/family/:id", rateLimiting, (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.show(req, res);
			});
		});

		/**
		 * POST /family
		 * @tags familys
		 * @summary This a new family and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new family - application/json
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
			"/family",
			rateLimiting,
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.create(req, res);
				});
			}
		);

		/**
		 * PUT /family/:id
		 * @tags familys
		 * @summary This updates a family by id
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"id": "string",
		 * 		"name": "string",
		 * 		"password": "string",
		 * 		"createdAt": "Date",
		 * 		"updatedAt": "Date",
		 * 		"familyType": "FamilyType"
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
			"/family/:id",
			rateLimiting,
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.update(req, res);
				});
			}
		);

		/**
		 * DELETE /family/:id
		 * @tags familys
		 * @summary This deletes a family by id
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
			"/family/:id",
			rateLimiting,
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.delete(req, res);
				});
			}
		);
	}

	private index(req: Request, res: Response): void {
		const familyDocuments = this._database.listAllDocuments<Family>(
			this._collectionName
		);

		familyDocuments
			.then((familys) => {
				if (familys === null) {
					familys = [];
				}

				familys.forEach((family) => {
					//@ts-ignore
					delete family._id;
				});

				res.send(familys);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
			});
	}

	private create(req: Request, res: Response): void {
		console.log(req.body);
		const family = new Family(
			null,
			req.body.Name,
			req.body.Description,
			req.body.Notes,
			req.body.HistoricalNames
		);

		this._database
			.createDocument<Family>(this._collectionName, family)
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500, message: error.message });
			});

		res.send(family);
	}

	private show(req: Request, res: Response): void {
		const familyDocument = this._database.findDocument<Family>(
			this._collectionName,
			req.params.id
		);

		familyDocument
			.then((family) => {
				if (family === null) {
					res.status(404).send({ status: 404 });
					return;
				}
				//@ts-ignore
				delete family!._id;
				res.send(family);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
			});
	}

	private update(req: Request, res: Response): void {
		const familyDocument = this._database.findDocument<Family>(
			this._collectionName,
			req.params.id
		);

		familyDocument
			.then((family) => {
				if (family === null || family === undefined) {
					res.status(404).send({ status: 404 });
					return;
				}
				const updatedFamily = new Family(
					family.Id,
					req.body.Name ?? family.Name,
					req.body.Description ?? family.Description,
					req.body.Notes ?? family.Notes,
					req.body.HistoricalNames ?? family.HistoricalNames
				);

				const result = JSON.stringify(updatedFamily);

				this._database
					.updateDocument(
						this._collectionName,
						familyDocument,
						updatedFamily
					)
					.then(() => {
						res.status(200).send(result);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send({ status: 500 });
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
			});
	}

	private delete(req: Request, res: Response): void {
		const familyDocument = this._database.findDocument<Family>(
			this._collectionName,
			req.path.split("/")[2]
		);

		familyDocument
			.then((family) => {
				if (family === null || family === undefined) {
					res.status(404).send({ status: 404 });
					return;
				}
				this._database
					.deleteDocument(this._collectionName, family)
					.then(() => {
						res.status(200).send({
							success: true,
							message: `Family ${family.Name} with id ${family.Id} deleted successfully`,
						});
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send({ status: 500 });
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
			});
	}
}
