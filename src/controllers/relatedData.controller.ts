import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import DatabaseService from "../services/database.srvs.js";
import AuthorizationService from "../services/auth.srvs.js";
import bodyParser from "body-parser";
import ErrorResult from "../models/actionResults/error.result.js";
import Ok from "../models/actionResults/ok.result.js";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum.js";
import Paginator from "../classes/paginator.js";
import RelatedData from "../models/data.model.js";

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
			this._authorization.authorize(req, res, () => {
				this.index(req, res);
			});
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
				this._authorization.authorize(req, res, () => {
					this.indexPaged(req, res);
				});
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
				this._authorization.authorize(req, res, () => {
					this.getPageCount(req, res);
				});
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
		app.get("/relatedData/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.show(req, res);
			});
		});

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
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.create(req, res);
				});
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
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.update(req, res);
				});
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
		app.delete("/relatedData/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.delete(req, res);
			});
		});
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

				dataArray.forEach((data) => {
					//@ts-ignore
					delete data._id;
				});

				res.send(dataArray);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private indexPaged(req: Request, res: Response): void {
		const dataDocuments = this._database.listAllDocuments<RelatedData>(
			this._collectionName
		);

		dataDocuments
			.then((dataArray) => {
				if (dataArray === null) {
					dataArray = [];
				}

				dataArray.forEach((data) => {
					//@ts-ignore
					delete data._id;
				});

				const page = parseInt(req.params.page);
				const pageSize = parseInt(req.params.pageSize);

				const result = Paginator.paginate(dataArray, page, pageSize);

				res.send(result);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private getPageCount(req: Request, res: Response): void {
		const dataDocuments = this._database.listAllDocuments<RelatedData>(
			this._collectionName
		);

		dataDocuments
			.then((dataArray) => {
				if (dataArray === null) {
					dataArray = [];
				}

				dataArray.forEach((data) => {
					//@ts-ignore
					delete data._id;
				});

				const pageSize = parseInt(req.params.pageSize);

				const result = Paginator.getPageCount<RelatedData>(
					dataArray,
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
		let relatedData:
			| string
			| import("buffer").Blob
			| import("buffer").File = req.body.relatedData;

		let notes: string = req.body.notes || "";
		let taggedPersonsIds: string[] = req.body.taggedPersonsIds || [];

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

		this._database
			.createDocument<RelatedData>(this._collectionName, newRelatedData)
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});

		res.send(newRelatedData);
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
					//@ts-ignore
					delete data._id;
					res.send(data);
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private update(req: Request, res: Response): void {
		const dataDocument = this._database.findDocument<RelatedData>(
			this._collectionName,
			req.params.id
		);

		dataDocument
			.then((data) => {
				if (data === null || data === undefined) {
					res.status(404).send(new ErrorResult(404));
				} else {
					let relatedData:
						| string
						| import("buffer").Blob
						| import("buffer").File = req.body.relatedData;

					let notes: string = req.body.notes || "";
					let taggedPersonsIds: string[] =
						req.body.taggedPersonsIds || [];

					if (typeof relatedData === "string") {
						relatedData = relatedData.trim();
					}

					if (typeof notes === "string") {
						notes = notes.trim();
					}

					if (typeof taggedPersonsIds === "string") {
						taggedPersonsIds = [taggedPersonsIds];
					}

					const updatedData = new RelatedData(
						relatedData,
						notes,
						taggedPersonsIds
					);

					this._database
						.updateDocument<RelatedData>(
							this._collectionName,
							dataDocument,
							updatedData
						)
						.catch(() => {
							res.status(500).send(new ErrorResult(500));
						});

					res.send(data);
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private delete(req: Request, res: Response): void {
		const dataDocument = this._database.findDocument<RelatedData>(
			this._collectionName,
			req.path.split("/")[2]
		);

		dataDocument
			.then((data) => {
				if (data === null || data === undefined) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				this._database
					.deleteDocument(this._collectionName, data)
					.then(() => {
						res.status(200).send(
							new Ok(
								`Related Data with id ${data.Id} deleted successfully`
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
