import bodyParser from "body-parser";
import { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import SecurityHelper from "../classes/securityHelper.js";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum.js";
import { IController } from "../interfaces/controller.interface.js";
import ErrorResult from "../models/actionResults/error.result.js";
import Ok from "../models/actionResults/ok.result.js";
import RelatedData from "../models/data.model.js";
import AuthorizationService from "../services/auth.srvs.js";
import DatabaseService from "../services/database.srvs.js";

export default class RelatedDataController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = DatabaseCollectionEnum.DATA;

	public routes(app: Express): void {
		/**
		 * GET /relatedData
		 * @tags relatedData
		 * @summary This returns an array of all relatedData
		 * @security BearerAuth
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"RelatedData": "Related data",
		 * 		"Notes": "Notes",
		 * 		"TaggedPersonsIds": ["1", "2"],
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
		app.get("/relatedData", (req: Request, res: Response) => {
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
		 * GET /relatedData/:pageSize/:page
		 * @tags relatedData
		 * @summary This returns an array of all relatedData paged
		 * @security BearerAuth
		 * @param {string} pageSize.path.required - the page size
		 * @param {string} page.path.required - the page number
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"RelatedData": "Related data",
		 * 		"Notes": "Notes",
		 * 		"TaggedPersonsIds": ["1", "2"],
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
		app.get(
			"/relatedData/:pageSize/:page",
			(req: Request, res: Response) => {
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
		 * GET /relatedData/pageCount/:pageSize
		 * @tags relatedData
		 * @summary This returns the page count of all relatedData
		 * @security BearerAuth
		 * @param {string} pageSize.path.required - the page size
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 		"pageCount": 1
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
			"/relatedData/pageCount/:pageSize",
			(req: Request, res: Response) => {
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
		 * GET /relatedData/:id
		 * @tags relatedData
		 * @summary This returns a relatedData by id
		 * @security BearerAuth
		 * @param {string} id.path.required - the id of the relatedData
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 		"RelatedData": "Related data",
		 * 		"Notes": "Notes",
		 * 		"TaggedPersonsIds": ["1", "2"],
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
			"/relatedData/:id",
			[
				param("id")
					.isUUID()
					.withMessage("ID must be a valid UUID."),
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
		 * POST /relatedData
		 * @tags relatedData
		 * @summary This a new relatedData and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new relatedData - application/json
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 		"RelatedData": "Related data",
		 * 		"Notes": "Notes",
		 * 		"TaggedPersonsIds": ["1", "2"],
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
			"/relatedData",
			bodyParser.json(),
			[
				body("RelatedData")
					.isString()
					.withMessage("RelatedData must be a string."),
				body("Notes").optional().isString(),
				body("TaggedPersonsIds").optional().isArray(),
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
		 * PUT /relatedData/:id
		 * @tags relatedData
		 * @summary This updates a relatedData by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 		"RelatedData": "Related data",
		 * 		"Notes": "Notes",
		 * 		"TaggedPersonsIds": ["1", "2"],
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
			"/relatedData/:id",
			bodyParser.json(),
			[
				param("id")
					.isUUID()
					.withMessage("ID must be a valid UUID."),
				body("RelatedData").optional().isString(),
				body("Notes").optional().isString(),
				body("TaggedPersonsIds").optional().isArray(),
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
		 * DELETE /relatedData/:id
		 * @tags relatedData
		 * @summary This deletes a relatedData by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"success": true,
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
		app.delete(
			"/relatedData/:id",
			[
				param("id")
					.isUUID()
					.withMessage("ID must be a valid UUID."),
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
					["Admin", "Editor"]
				);
			}
		);
	}

	private index(req: Request, res: Response): void {
		const dataDocuments = this._database.listAllDocuments<RelatedData>(
			this._collectionName
		);

		dataDocuments
			.then((dataArray) => {
				if (dataArray === null) {
					dataArray = [];
				}

				res.send(SecurityHelper.removeMongoIds(dataArray));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private async indexPaged(req: Request, res: Response): Promise<void> {
		try {
			const page = parseInt(req.params.page);
			const pageSize = parseInt(req.params.pageSize);
			const dataArray =
				await this._database.listDocumentsPage<RelatedData>(
					this._collectionName,
					page,
					pageSize
				);
			res.send(SecurityHelper.removeMongoIds(dataArray));
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
			let relatedData:
				| string
				| import("buffer").Blob
				| import("buffer").File =
				req.body.RelatedData ?? req.body.relatedData;

			let notes: string = req.body.Notes ?? req.body.notes ?? "";
			let taggedPersonsIds: string[] =
				req.body.TaggedPersonsIds ?? req.body.taggedPersonsIds ?? [];

			if (typeof relatedData === "string") {
				relatedData = relatedData.trim();
			}

			if (typeof notes === "string") {
				notes = notes.trim();
			}

			if (typeof taggedPersonsIds === "string") {
				taggedPersonsIds = [taggedPersonsIds];
			}

			const newRelatedData = new RelatedData(
				relatedData,
				notes,
				taggedPersonsIds
			);

			await this._database.createDocument<RelatedData>(
				this._collectionName,
				newRelatedData
			);

			res.send(SecurityHelper.removeMongoId(newRelatedData));
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private show(req: Request, res: Response): void {
		const dataDocument = this._database.findDocument<RelatedData>(
			this._collectionName,
			req.params.id
		);

		dataDocument
			.then((data) => {
				if (data === null) {
					res.status(404).send(new ErrorResult(404));
				} else {
					res.send(SecurityHelper.removeMongoId(data));
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private async update(req: Request, res: Response): Promise<void> {
		try {
			const data = await this._database.findDocument<RelatedData>(
				this._collectionName,
				req.params.id
			);
			if (!data) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			let relatedData:
				| string
				| import("buffer").Blob
				| import("buffer").File =
				req.body.RelatedData ??
				req.body.relatedData ??
				data.RelatedData;

			let notes: string = req.body.Notes ?? req.body.notes ?? data.Notes;
			let taggedPersonsIds: string[] =
				req.body.TaggedPersonsIds ??
				req.body.taggedPersonsIds ??
				data.TaggedPersonsIds;

			if (typeof relatedData === "string") {
				relatedData = relatedData.trim();
			}

			if (typeof notes === "string") {
				notes = notes.trim();
			}

			if (typeof taggedPersonsIds === "string") {
				taggedPersonsIds = [taggedPersonsIds];
			}

			const updatedData = {
				...data,
				RelatedData: relatedData,
				Notes: notes,
				TaggedPersonsIds: taggedPersonsIds,
			};

			await this._database.updateDocument<RelatedData>(
				this._collectionName,
				{ Id: data.Id },
				updatedData
			);

			res.send(SecurityHelper.removeMongoId(updatedData));
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private async delete(req: Request, res: Response): Promise<void> {
		try {
			const data = await this._database.findDocument<RelatedData>(
				this._collectionName,
				req.params.id
			);
			if (!data) {
				res.status(404).send(new ErrorResult(404));
				return;
			}
			await this._database.deleteDocument(this._collectionName, {
				Id: data.Id,
			});
			res.status(200).send(
				new Ok(`Related Data with id ${data.Id} deleted successfully`)
			);
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}
}
