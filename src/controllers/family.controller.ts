import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import DatabaseService from "../services/database.srvs.js";
import Family from "../models/family.model.js";
import AuthorizationService from "../services/auth.srvs.js";
import bodyParser from "body-parser";
import ErrorResult from "../models/actionResults/error.result.js";
import Ok from "../models/actionResults/ok.result.js";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum.js";
import Paginator from "../classes/paginator.js";
import { body, param, validationResult } from "express-validator";

export default class FamilyController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = DatabaseCollectionEnum.FAMILIES;
	/**
	 * Routes family controller
	 * @param app
	 */
	public routes(app: Express): void {
		/**
		 * GET /familys
		 * @tags familys
		 * @summary This returns an array of all familys
		 * @security BearerAuth
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"Id": "string",
		 * 		"Name": "string",
		 * 		"Description": "string",
		 * 		"Notes": "string",
		 * 		"HistoricalNames": [
		 * 			"string"
		 * 		]
		 * 	},
		 * 	...
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
		app.get("/familys", (req: Request, res: Response) => {
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
		 * GET /familys/:pageSize/:page
		 * @tags familys
		 * @param {string} pageSize.path.required - the page size
		 * @param {string} page.path.required - the page
		 * @summary This returns an array of all familys paged
		 * @security BearerAuth
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"Id": "string",
		 * 		"Name": "string",
		 * 		"Description": "string",
		 * 		"Notes": "string",
		 * 		"HistoricalNames": [
		 * 			"string"
		 * 		]
		 * 	},
		 * 	...
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
		app.get("/familys/:pageSize/:page", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.indexPaged(req, res);
			});
		});

		/**
		 * GET /familys/pageCount/:pageSize
		 * @tags familys
		 * @param {string} pageSize.path.required - the page size
		 * @summary This returns the page count for the familys
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"pageCount": 1
		 * }
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
			"/familys/pageCount/:pageSize",
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.getPageCount(req, res);
				});
			}
		);

		/**
		 * GET /family/:id
		 * @tags familys
		 * @summary This returns a family by id
		 * @security BearerAuth
		 * @param {string} id.path.required - the id of the family
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"Id": "string",
		 * 		"Name": "string",
		 * 		"Description": "string",
		 * 		"Notes": "string",
		 * 		"HistoricalNames": [
		 * 			"string"
		 * 		]
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
			"/family/:id",
			[param("id").isString().withMessage("ID muss angegeben werden.")],
			(req: Request, res: Response) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				this._authorization.authorize(req, res, () => {
					this.show(req, res);
				});
			}
		);

		/**
		 * POST /family
		 * @tags familys
		 * @summary This a new family and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new family - application/json
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"Id": "string",
		 * 		"Name": "string",
		 * 		"Description": "string",
		 * 		"Notes": "string",
		 * 		"HistoricalNames": [
		 * 			"string"
		 * 		]
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
			bodyParser.json(),
			[
				body("Name")
					.isString()
					.withMessage("Name muss ein String sein."),
				body("Description").optional().isString(),
				body("Notes").optional().isString(),
				body("HistoricalNames").optional().isArray(),
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
					["Admin", "Editor"]
				);
			}
		);

		/**
		 * PUT /family/:id
		 * @tags familys
		 * @summary This updates a family by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * 	{
		 * 		"Id": "string",
		 * 		"Name": "string",
		 * 		"Description": "string",
		 * 		"Notes": "string",
		 * 		"HistoricalNames": [
		 * 			"string"
		 * 		]
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
			bodyParser.json(),
			[
				param("id").isString().withMessage("ID muss angegeben werden."),
				body("Name").optional().isString(),
				body("Description").optional().isString(),
				body("Notes").optional().isString(),
				body("HistoricalNames").optional().isArray(),
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
		 * DELETE /family/:id
		 * @tags familys
		 * @summary This deletes a family by id
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
			"/family/:id",
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

		/**
		 * POST /family/:id/addMember
		 * @summary Fügt eine Person (ID) zur Familie hinzu
		 * @param {string} id.path.required - die ID der Familie
		 * @param {string} personId.body.required - die ID der Person
		 * @return {object} 200 - success response - application/json
		 */
		app.post(
			"/family/:id/addMember",
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.addMember(req, res);
					},
					["Admin", "Editor"]
				);
			}
		);

		/**
		 * POST /family/:id/removeMember
		 * @summary Entfernt eine Person (ID) aus der Familie
		 * @param {string} id.path.required - die ID der Familie
		 * @param {string} personId.body.required - die ID der Person
		 * @return {object} 200 - success response - application/json
		 */
		app.post(
			"/family/:id/removeMember",
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.removeMember(req, res);
					},
					["Admin", "Editor"]
				);
			}
		);

		/**
		 * GET /family/:id/lastnames
		 * @summary Gibt die Nachnamen aller Mitglieder der Familie zurück
		 * @param {string} id.path.required - die ID der Familie
		 * @return {object} 200 - success response - application/json
		 */
		app.get("/family/:id/lastnames", (req: Request, res: Response) => {
			this._authorization.requireRole(
				req,
				res,
				() => {
					this.getLastNames(req, res);
				},
				["Admin", "Editor", "Viewer"]
			);
		});
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
				res.status(500).send(new ErrorResult(500));
			});
	}

	private indexPaged(req: Request, res: Response): void {
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

				const pageSize = parseInt(req.params.pageSize);
				const page = parseInt(req.params.page);

				const result = Paginator.paginate<Family>(
					familys,
					pageSize,
					page
				);

				res.send(result);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private getPageCount(req: Request, res: Response): void {
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

				const pageSize = parseInt(req.params.pageSize);

				const result = Paginator.getPageCount<Family>(
					familys,
					pageSize
				);

				res.send({ pageCount: result });
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private create(req: Request, res: Response): void {
		console.log(req.body);
		const family = new Family(
			null,
			req.body.Name,
			req.body.Description,
			req.body.Notes,
			req.body.HistoricalNames,
			req.body.MemberIds ?? []
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
					res.status(404).send(new ErrorResult(404));
					return;
				}
				//@ts-ignore
				delete family!._id;
				res.send(family);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
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
					res.status(404).send(new ErrorResult(404));
					return;
				}
				const updatedFamily = new Family(
					family.Id,
					req.body.Name ?? family.Name,
					req.body.Description ?? family.Description,
					req.body.Notes ?? family.Notes,
					req.body.HistoricalNames ?? family.HistoricalNames,
					req.body.MemberIds ?? family.MemberIds
				);

				// Sanitize the updatedFamily object
				const sanitizedFamily = {
					Id: updatedFamily.Id,
					Name: escapeHtml(updatedFamily.Name),
					Description: escapeHtml(updatedFamily.Description),
					Notes: escapeHtml(updatedFamily.Notes),
					HistoricalNames:
						updatedFamily.HistoricalNames.map(escapeHtml),
				};

				this._database
					.updateDocument(
						this._collectionName,
						familyDocument,
						updatedFamily
					)
					.then(() => {
						res.status(200).send(sanitizedFamily);
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
		const familyDocument = this._database.findDocument<Family>(
			this._collectionName,
			req.path.split("/")[2]
		);

		familyDocument
			.then((family) => {
				if (family === null || family === undefined) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				this._database
					.deleteDocument(this._collectionName, family)
					.then(() => {
						res.status(200).send(
							new Ok(
								`Family ${family.Name} with id ${family.Id} deleted successfully`
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

	/**
	 * Fügt eine Person (personId) zur Familie (id) hinzu
	 */
	private addMember(req: Request, res: Response): void {
		const familyId = req.params.id;
		const personId = req.body.personId;
		if (!personId) {
			res.status(400).send({ status: 400, message: "personId fehlt" });
			return;
		}
		this._database
			.findDocument<Family>(this._collectionName, familyId)
			.then((family) => {
				if (!family) {
					res.status(404).send({
						status: 404,
						message: "Familie nicht gefunden",
					});
					return;
				}
				if (!family.MemberIds.includes(personId)) {
					family.MemberIds.push(personId);
				}
				this._database
					.updateDocument(
						this._collectionName,
						{ Id: familyId },
						family
					)
					.then(() =>
						res.status(200).send({
							success: true,
							MemberIds: family.MemberIds,
						})
					)
					.catch((error) =>
						res
							.status(500)
							.send({ status: 500, message: error.message })
					);
			})
			.catch((error) =>
				res.status(500).send({ status: 500, message: error.message })
			);
	}

	/**
	 * Entfernt eine Person (personId) aus der Familie (id)
	 */
	private removeMember(req: Request, res: Response): void {
		const familyId = req.params.id;
		const personId = req.body.personId;
		if (!personId) {
			res.status(400).send({ status: 400, message: "personId fehlt" });
			return;
		}
		this._database
			.findDocument<Family>(this._collectionName, familyId)
			.then((family) => {
				if (!family) {
					res.status(404).send({
						status: 404,
						message: "Familie nicht gefunden",
					});
					return;
				}
				family.MemberIds = family.MemberIds.filter(
					(id) => id !== personId
				);
				this._database
					.updateDocument(
						this._collectionName,
						{ Id: familyId },
						family
					)
					.then(() =>
						res.status(200).send({
							success: true,
							MemberIds: family.MemberIds,
						})
					)
					.catch((error) =>
						res
							.status(500)
							.send({ status: 500, message: error.message })
					);
			})
			.catch((error) =>
				res.status(500).send({ status: 500, message: error.message })
			);
	}

	/**
	 * Gibt die Nachnamen aller Mitglieder der Familie zurück
	 */
	private getLastNames(req: Request, res: Response): void {
		const familyId = req.params.id;
		this._database
			.findDocument<Family>(this._collectionName, familyId)
			.then((family) => {
				if (!family) {
					res.status(404).send({
						status: 404,
						message: "Familie nicht gefunden",
					});
					return;
				}
				if (!family.MemberIds || family.MemberIds.length === 0) {
					res.status(200).send({ lastNames: [] });
					return;
				}
				this._database
					.listAllDocuments<any>(DatabaseCollectionEnum.PERSONS)
					.then((persons) => {
						const lastNames = persons
							.filter((p: any) => family.MemberIds.includes(p.Id))
							.flatMap((p: any) => p.LastName || []);
						res.status(200).send({
							lastNames: Array.from(new Set(lastNames)),
						});
					})
					.catch((error) =>
						res
							.status(500)
							.send({ status: 500, message: error.message })
					);
			})
			.catch((error) =>
				res.status(500).send({ status: 500, message: error.message })
			);
	}
}

// Utility function to escape HTML
function escapeHtml(input: string): string {
	return input.replace(/[&<>'"/]/g, (char) => {
		const escapeChars: { [key: string]: string } = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"'": "&#39;",
			'"': "&quot;",
			"/": "&#x2F;",
		};
		return escapeChars[char] || char;
	});
}
