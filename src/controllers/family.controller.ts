import bodyParser from "body-parser";
import escapeHtml from "escape-html";
import { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import SecurityHelper from "../classes/securityHelper";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum";
import { IController } from "../interfaces/controller.interface.js";
import ErrorResult from "../models/actionResults/error.result";
import Ok from "../models/actionResults/ok.result";
import Family from "../models/family.model";
import AuthorizationService from "../services/auth.srvs";
import DatabaseService from "../services/database.srvs";

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
		app.get(
			"/familys/:pageSize/:page",
			[
				param("pageSize")
					.isInt({ min: 1, max: 100 })
					.withMessage(
						"pageSize muss eine Zahl zwischen 1 und 100 sein."
					),
				param("page")
					.isInt({ min: 1 })
					.withMessage("page muss eine positive Zahl sein."),
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
						this.indexPaged(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

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
			[
				param("pageSize")
					.isInt({ min: 1, max: 100 })
					.withMessage(
						"pageSize muss eine Zahl zwischen 1 und 100 sein."
					),
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
						this.getPageCount(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
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
			[
				param("id")
					.isUUID()
					.withMessage("ID muss eine gültige UUID sein."),
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
						this.show(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
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
				param("id")
					.isUUID()
					.withMessage("ID muss eine gültige UUID sein."),
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
			[
				param("id")
					.isUUID()
					.withMessage("ID muss eine gültige UUID sein."),
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
		app.get(
			"/family/:id/lastnames",
			[
				param("id")
					.isUUID()
					.withMessage("ID muss eine gültige UUID sein."),
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
						this.getLastNames(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
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

				res.send(SecurityHelper.removeMongoIds(familys));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private async indexPaged(req: Request, res: Response): Promise<void> {
		try {
			const pageSize = parseInt(req.params.pageSize);
			const page = parseInt(req.params.page);
			const familys = await this._database.listDocumentsPage<Family>(
				this._collectionName,
				page,
				pageSize
			);
			res.send(SecurityHelper.removeMongoIds(familys));
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private async getPageCount(req: Request, res: Response): Promise<void> {
		try {
			const pageSize = parseInt(req.params.pageSize);
			const count = await this._database.countDocuments(
				this._collectionName
			);
			res.send({ pageCount: Math.ceil(count / pageSize) });
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private async create(req: Request, res: Response): Promise<void> {
		try {
			const family = new Family(
				null,
				escapeHtml(req.body.Name),
				escapeHtml(req.body.Description ?? ""),
				escapeHtml(req.body.Notes ?? ""),
				(req.body.HistoricalNames ?? []).map((value: string) =>
					escapeHtml(value)
				),
				req.body.MemberIds ?? []
			);

			await this._database.createDocument<Family>(
				this._collectionName,
				family
			);
			res.send(SecurityHelper.removeMongoId(family));
		} catch (error: any) {
			console.error(error);
			res.status(500).send({ status: 500, message: error.message });
		}
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
				res.send(SecurityHelper.removeMongoId(family));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private async update(req: Request, res: Response): Promise<void> {
		try {
			const family = await this._database.findDocument<Family>(
				this._collectionName,
				req.params.id
			);
			if (!family) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const updatedFamily = new Family(
				family.Id,
				escapeHtml(req.body.Name ?? family.Name),
				escapeHtml(req.body.Description ?? family.Description),
				escapeHtml(req.body.Notes ?? family.Notes),
				(req.body.HistoricalNames ?? family.HistoricalNames).map(
					(value: string) => escapeHtml(value)
				),
				req.body.MemberIds ?? family.MemberIds
			);

			await this._database.updateDocument(
				this._collectionName,
				{ Id: updatedFamily.Id },
				updatedFamily
			);
			res.status(200).send(SecurityHelper.removeMongoId(updatedFamily));
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private async delete(req: Request, res: Response): Promise<void> {
		try {
			const family = await this._database.findDocument<Family>(
				this._collectionName,
				req.params.id
			);
			if (!family) {
				res.status(404).send(new ErrorResult(404));
				return;
			}
			await this._database.deleteDocument(this._collectionName, {
				Id: family.Id,
			});
			res.status(200).send(
				new Ok(
					`Family ${family.Name} with id ${family.Id} deleted successfully`
				)
			);
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
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
