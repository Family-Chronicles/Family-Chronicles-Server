import bodyParser from "body-parser";
import escapeHtml from "escape-html";
import { Express, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import SecurityHelper from "../classes/securityHelper";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum";
import { RelationshipTypeEnum } from "../enums/relationship.enum";
import { IController } from "../interfaces/controller.interface.js";
import ErrorResult from "../models/actionResults/error.result";
import Ok from "../models/actionResults/ok.result";
import RelatedData from "../models/data.model";
import Person from "../models/person.model";
import Relationship from "../models/relationship.model";
import AuthorizationService from "../services/auth.srvs";
import DatabaseService from "../services/database.srvs";

export default class PersonController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = DatabaseCollectionEnum.PERSONS;

	public routes(app: Express): void {
		/**
		 * GET /persons
		 * @tags persons
		 * @summary This returns an array of all persons
		 * @security BearerAuth
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"FirstName": ["John"],
		 * 		"LastName": ["Doe"],
		 * 		"Sex": "Male",
		 * 		"Gender": "Male",
		 * 		"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 		"DateOfDeath": null,
		 * 		"PlaceOfBirth": "New York",
		 * 		"PlaceOfDeath": null,
		 * 		"RelationshipIds": [],
		 * 		"Notes": "",
		 * 		"FamilyIds": [],
		 * 		"RelatedDataIds": [],
		 * 		 "ReasonOfDeath": null,
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
		app.get("/persons", (req: Request, res: Response) => {
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
		 * GET /persons/:pageSize/:page
		 * @tags persons
		 * @summary This returns an array of all persons paged
		 * @security BearerAuth
		 * @param {string} pageSize.path.required - the page size
		 * @param {string} page.path.required - the page number
		 * @return {object[]} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"FirstName": ["John"],
		 * 		"LastName": ["Doe"],
		 * 		"Sex": "Male",
		 * 		"Gender": "Male",
		 * 		"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 		"DateOfDeath": null,
		 * 		"PlaceOfBirth": "New York",
		 * 		"PlaceOfDeath": null,
		 * 		"RelationshipIds": [],
		 * 		"Notes": "",
		 * 		"FamilyIds": [],
		 * 		"RelatedDataIds": [],
		 * 		 "ReasonOfDeath": null,
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
			"/persons/:pageSize/:page",
			[
				param("pageSize")
					.isInt({ min: 1, max: 100 })
					.withMessage(
						"pageSize must be a number between 1 and 100."
					),
				param("page")
					.isInt({ min: 1 })
					.withMessage("page must be a positive number."),
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
		 * GET /persons/pageCount/:pageSize
		 * @tags persons
		 * @summary This returns the page count of all persons
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
			"/persons/pageCount/:pageSize",
			[
				param("pageSize")
					.isInt({ min: 1, max: 100 })
					.withMessage(
						"pageSize must be a number between 1 and 100."
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
		 * GET /person/:id
		 * @tags persons
		 * @summary This returns a person by id
		 * @security BearerAuth
		 * @param {string} id.path.required - the id of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
			"/person/:id",
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
		 * GET /person/name?firstName&lastName
		 * @tags persons
		 * @summary This returns a person by name
		 * @security BearerAuth
		 * @param {string} firstName.query.required - the first name of the person
		 * @param {string} lastName.query.required - the last name of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
			"/person/name?firstName&lastName",
			(req: Request, res: Response) => {
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.showByName(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

		/**
		 * POST /person/dateOfBirth
		 * @tags persons
		 * @summary This returns persons by date of birth
		 * @security BearerAuth
		 * @param {string} dateOfBirth.body.required - the date of birth of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [{
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
		 * },
		 * {
		 * 	"FirstName": ["Jane"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Female",
		 *  "Gender": "Female",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4b"
		 * }]
		 */
		app.post(
			"/person/dateOfBirth",
			bodyParser.json(),
			(req: Request, res: Response) => {
				this._authorization.requireRole(
					req,
					res,
					() => {
						this.showByDateOfBirth(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

		/**
		 * GET /person/relatedData/:relatedDataIds
		 * @tags persons
		 * @summary This returns persons by related data ids
		 * @security BearerAuth
		 * @param {string} relatedDataIds.path.required - the related data ids of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [{
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
		 * },
		 * {
		 * 	"FirstName": ["Jane"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Female",
		 *  "Gender": "Female",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4b"
		 * }]
		 */
		app.get(
			"/person/relatedData/:relatedDataIds",
			[
				param("relatedDataIds")
					.isString()
					.withMessage("relatedDataIds must be provided.")
					.custom((value: string) => {
						const ids = value.split(",");
						const uuidRegex =
							/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
						for (const id of ids) {
							if (!uuidRegex.test(id.trim())) {
								throw new Error(
									`Invalid UUID: ${id}. All IDs must be valid UUIDs.`
								);
							}
						}
						return true;
					}),
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
						this.showByRelatedDataIds(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

		/**
		 * POST /person
		 * @tags persons
		 * @summary This a new person and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new person - application/json
		 * @param {string | null} ReasonOfDeath.body.optional - the reason of death of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
		app.post(
			"/person",
			bodyParser.json(),
			[
				body("FirstName")
					.isArray()
					.notEmpty()
					.withMessage("FirstName must be a non-empty array."),
				body("LastName")
					.isArray()
					.notEmpty()
					.withMessage("LastName must be a non-empty array."),
				body("Sex")
					.optional()
					.isIn(["Male", "Female", "Intersex", "Other"])
					.withMessage(
						"Sex must be Male, Female, Intersex or Other."
					),
				body("Gender")
					.optional()
					.isString()
					.withMessage("Gender must be a string."),
				body("DateOfBirth")
					.optional()
					.isISO8601()
					.withMessage("DateOfBirth must be a valid date."),
				body("DateOfDeath")
					.optional()
					.isISO8601()
					.withMessage("DateOfDeath must be a valid date."),
				body("PlaceOfBirth").optional().isString().trim().escape(),
				body("PlaceOfDeath").optional().isString().trim().escape(),
				body("Notes").optional().isString().trim().escape(),
				body("ReasonOfDeath").optional().isString().trim().escape(),
				body("FamilyIds").optional().isArray(),
				body("RelationshipIds").optional().isArray(),
				body("RelatedDataIds").optional().isArray(),
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
		 * PUT /person/:id
		 * @tags persons
		 * @summary This updates a person by id
		 * @security BearerAuth
		 * @param {string | null} ReasonOfDeath.body.optional - the reason of death of the person
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
		 *  "Sex": "Male",
		 *  "Gender": "Male",
		 * 	"DateOfBirth": "2021-01-01T00:00:00.000Z",
		 * 	"DateOfDeath": null,
		 * 	"PlaceOfBirth": "New York",
		 * 	"PlaceOfDeath": null,
		 * 	"RelationshipIds": [],
		 * 	"Notes": "",
		 * 	"FamilyIds": [],
		 * 	"RelatedDataIds": [],
		 * 	 "ReasonOfDeath": null,
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a"
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
		app.put(
			"/person/:id",
			bodyParser.json(),
			[
				param("id")
					.isUUID()
					.withMessage("ID must be a valid UUID."),
				body("FirstName").optional().isArray(),
				body("LastName").optional().isArray(),
				body("DateOfBirth").optional().isISO8601(),
				body("DateOfDeath").optional().isISO8601(),
				body("PlaceOfBirth").optional().isString(),
				body("PlaceOfDeath").optional().isString(),
				body("Notes").optional().isString(),
				body("FamilyIds").optional().isArray(),
				body("RelationshipIds").optional().isArray(),
				body("RelatedDataIds").optional().isArray(),
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
		 * DELETE /person/:id
		 * @tags persons
		 * @summary This deletes a person by id
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
			"/person/:id",
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

		/**
		 * GET /person/:id/relationships
		 * @tags persons
		 * @summary This gets the relationships of a person by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * [
		 * 	{
		 * 		"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 		"RelationPartnerOneId": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 		"RelationPartnerTwoId": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 		"RelationType": "Married",
		 * 		"Notes": "",
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
			"/person/:id/relationships",
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
						this.showRelationships(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

		/**
		 * GET /person/:id/relationships/:relationshipId
		 * @tags persons
		 * @summary This gets a relationship of a person by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 	"RelationPartnerOneId": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 	"RelationPartnerTwoId": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4a",
		 * 	"RelationType": "Married",
		 * 	"Notes": "",
		 * }
		 */
		app.get(
			"/person/:id/relationships/:relationshipId",
			[
				param("id")
					.isUUID()
					.withMessage("ID must be a valid UUID."),
				param("relationshipId")
					.isUUID()
					.withMessage("relationshipId must be a valid UUID."),
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
						this.showRelationship(req, res);
					},
					["Admin", "Editor", "Viewer"]
				);
			}
		);

		/**
		 * POST /person/:id/relationship
		 * @tags persons
		 * @summary This adds a relationship to a person by id
		 * @security BearerAuth
		 * @param {object} request.body.required - the request body
		 * @param {string} request.body.relationPartnerOneId.required - the id of the first person in the relationship
		 * @param {string} request.body.relationPartnerTwoId.required - the id of the second person in the relationship
		 * @param {string} request.body.relationType.required - the type of relationship
		 * @param {string} request.body.notes - notes about the relationship
		 * @param {string} request.body.role - role of the person in the relationship
		 * @param {string} request.body.startDate - start date of the relationship (ISO string)
		 * @param {string} request.body.endDate - end date of the relationship (ISO string)
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 *   "Id": "...",
		 *   ...
		 *   "Role": "Mutter",
		 *   "StartDate": "2020-01-01T00:00:00.000Z",
		 *   "EndDate": null
		 * }
		 */
		app.post(
			"/person/:id/relationship",
			bodyParser.json(),
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
						this.addRelationship(req, res);
					},
					["Admin", "Editor"]
				);
			}
		);

		/**
		 * PUT /person/:id/relationships/:relationshipId
		 * @tags persons
		 * @summary This updates a relationship of a person by id
		 * @security BearerAuth
		 * @param {object} request.body.required - the request body
		 * @param {string} request.body.relationPartnerOneId.required - the id of the first person in the relationship
		 * @param {string} request.body.relationPartnerTwoId.required - the id of the second person in the relationship
		 * @param {string} request.body.relationType.required - the type of relationship
		 * @param {string} request.body.notes - notes about the relationship
		 * @param {string} request.body.role - role of the person in the relationship
		 * @param {string} request.body.startDate - start date of the relationship (ISO string)
		 * @param {string} request.body.endDate - end date of the relationship (ISO string)
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	 status: 200
		 * }
		 */
		app.post(
			"/person/:id/uploadMedia",
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
						this.uploadMedia(req, res);
					},
					["Admin", "Editor"]
				);
			}
		);

		/**
		 * POST /person/:id/tagMedia
		 * @summary Verknüpft ein Medium mit einer Person und taggt weitere Personen
		 * @param {string} id.path.required - die ID der Person
		 * @param {string} mediaId.body.required - die ID des Mediums
		 * @param {string[]} taggedPersonIds.body.required - die zu taggenden Personen
		 * @return {object} 200 - success response - application/json
		 */
		app.post(
			"/person/:id/tagMedia",
			bodyParser.json(),
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
						this.tagMedia(req, res);
					},
					["Admin", "Editor"]
				);
			}
		);
	}

	private deleteRelationship(req: Request, res: Response) {
		const id = req.params.id;
		const relationshipId = req.params.relationshipId;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				Id: id,
			}
		);

		personDocument.then((persons) => {
			if (persons.length === 0) {
				res.status(404).send(new ErrorResult(404, "Person not found"));
				return;
			}

			const person = persons[0];
			person.RelationshipIds = (person.RelationshipIds ?? []).filter(
				(existingRelationshipId) =>
					existingRelationshipId !== relationshipId
			);

			const relationship =
				this._database.getDocumentByQuery<Relationship>(
					DatabaseCollectionEnum.RELATIONS,
					{ Id: relationshipId }
				);

			relationship.then((relationships) => {
				if (relationships.length === 0) {
					res.status(404).send(
						new ErrorResult(404, "Relationship not found")
					);
					return;
				}

				const relationship = relationships[0];

				if (
					relationship.RelationPartnerOneId !== id &&
					relationship.RelationPartnerTwoId !== id
				) {
					res.status(404).send(
						new ErrorResult(
							404,
							"Relationship does not belong to person"
						)
					);
					return;
				}

				const deletion = this._database.deleteDocument(
					DatabaseCollectionEnum.RELATIONS,
					{
						Id: relationshipId,
					}
				);

				deletion.then((status) => {
					if (!status) {
						res.status(500).send(
							new ErrorResult(
								500,
								"Failed to delete relationship"
							)
						);
						return;
					}

					const result = this._database.updateDocument<Person>(
						this._collectionName,
						{ Id: id },
						person
					);

					result.then((resultPerson) => {
						if (!resultPerson) {
							res.status(500).send(
								new ErrorResult(
									500,
									"Failed to delete relationship from person"
								)
							);
							return;
						}

						res.status(200).send(
							new Ok(
								`Deleted relationship for person ${person.Id}`
							)
						);
					});
				});
			});
		});
	}

	private updateRelationship(req: Request, res: Response) {
		const id = req.params.id;
		const relationshipId = req.params.relationshipId;
		let rel;
		try {
			rel =
				typeof req.body.relationship === "string"
					? JSON.parse(req.body.relationship)
					: req.body.relationship;
		} catch (err) {
			res.status(400).send(
				new ErrorResult(400, "Invalid relationship JSON format")
			);
			return;
		}

		const startDate = rel.StartDate ? new Date(rel.StartDate) : null;
		const endDate = rel.EndDate ? new Date(rel.EndDate) : null;
		const role = rel.Role ?? null;

		const resultRelation = new Relationship(
			relationshipId,
			id,
			rel.RelationPartnerTwoId ?? "",
			rel.RelationshipType ?? RelationshipTypeEnum.Unknown,
			rel.Notes ?? "",
			startDate,
			endDate,
			role
		);

		if (resultRelation.RelationPartnerTwoId === "") {
			res.status(400).send(
				new ErrorResult(400, "Missing RelationPartnerTwoId")
			);
			return;
		}

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				Id: id,
			}
		);

		personDocument.then((persons) => {
			if (persons === null || persons.length === 0) {
				res.status(404).send(new ErrorResult(404, "Person not found"));
				return;
			}

			const relationshipDocument =
				this._database.getDocumentByQuery<Relationship>(
					DatabaseCollectionEnum.RELATIONS,
					{
						Id: relationshipId,
					}
				);

			relationshipDocument.then((relationships) => {
				if (relationships === null || relationships.length === 0) {
					res.status(404).send(
						new ErrorResult(404, "Relationship not found")
					);
					return;
				}

				const relationshipFromDb = relationships[0];

				if (relationshipFromDb.RelationPartnerOneId !== id) {
					res.status(403).send(
						new ErrorResult(
							403,
							"Person is not allowed to update this relationship"
						)
					);
					return;
				}

				this._database
					.updateDocument<Relationship>(
						DatabaseCollectionEnum.RELATIONS,
						relationshipFromDb,
						resultRelation
					)
					.then((result) => {
						if (result === null) {
							res.status(500).send(
								new ErrorResult(
									500,
									"Error updating relationship"
								)
							);
							return;
						}

						res.status(200).send(new Ok("Relationship updated"));
					});
			});
		});
	}

	private addRelationship(req: Request, res: Response) {
		const id = req.params.id;
		let rel;
		try {
			rel =
				typeof req.body.relationship === "string"
					? JSON.parse(req.body.relationship)
					: req.body.relationship;
		} catch (err) {
			res.status(400).send(
				new ErrorResult(400, "Invalid relationship JSON format")
			);
			return;
		}

		const startDate = rel.StartDate ? new Date(rel.StartDate) : null;
		const endDate = rel.EndDate ? new Date(rel.EndDate) : null;
		const role = rel.Role ?? null;

		const resultRelation = new Relationship(
			null,
			id,
			rel.RelationPartnerTwoId ?? "",
			rel.RelationshipType ?? RelationshipTypeEnum.Unknown,
			rel.Notes ?? "",
			startDate,
			endDate,
			role
		);

		if (resultRelation.RelationPartnerTwoId === "") {
			res.status(400).send(
				new ErrorResult(400, "Missing RelationPartnerTwoId")
			);
			return;
		}

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				Id: id,
			}
		);

		personDocument.then((persons) => {
			if (persons === null || persons.length === 0) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const person = persons[0];

			if (!person.RelationshipIds) {
				person.RelationshipIds = [];
			}

			person.RelationshipIds.push(resultRelation.Id);

			const updatePerson = this._database.updateDocument(
				this._collectionName,
				{ Id: id },
				person
			);

			updatePerson.then((result) => {
				if (result === false) {
					res.status(500).send(new ErrorResult(500));
					return;
				}
				this._database
					.createDocument<Relationship>(
						DatabaseCollectionEnum.RELATIONS,
						resultRelation
					)
					.then((result) => {
						if (result === false) {
							res.status(500).send(new ErrorResult(500));
							return;
						}

						res.status(200).send(new Ok());
					});
			});
		});
	}

	private showRelationship(req: Request, res: Response) {
		const id = req.params.id;
		const relationshipId = req.params.relationshipId;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				Id: id,
			}
		);

		personDocument.then((person) => {
			if (!person || person.length === 0) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const relationshipIds = person[0].RelationshipIds ?? [];

			if (relationshipIds.length === 0) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			if (relationshipIds.indexOf(relationshipId) === -1) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const relationshipDocument =
				this._database.getDocumentByQuery<Relationship>(
					DatabaseCollectionEnum.RELATIONS,
					{
						Id: relationshipId,
					}
				);

			relationshipDocument.then((relationship) => {
				if (!relationship || relationship.length === 0) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				res.status(200).send(relationship[0]);
			});
		});
	}

	private showRelationships(req: Request, res: Response) {
		const id = req.params.id;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				Id: id,
			}
		);

		personDocument.then((person) => {
			if (!person || person.length === 0) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const relationshipIds = person[0].RelationshipIds ?? [];
			if (relationshipIds.length === 0) {
				res.status(200).send([]);
				return;
			}

			const relationshipDocuments =
				this._database.getDocumentByQuery<Relationship>(
					DatabaseCollectionEnum.RELATIONS,
					{
						Id: { $in: relationshipIds },
					}
				);

			relationshipDocuments
				.then((relationships) => {
					if (relationships === null || relationships.length === 0) {
						res.status(404).send(new ErrorResult(404));
						return;
					}

					res.status(200).send(relationships);
				})
				.catch((error) => {
					console.error(error);
					res.status(500).send(new ErrorResult(500));
				});
		});
	}

	private showByRelatedDataIds(req: Request, res: Response) {
		const relatedDataIds = req.params.relatedDataIds.split(",");

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				RelatedDataIds: { $in: relatedDataIds },
			}
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				res.send(SecurityHelper.removeMongoId(person));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private showByDateOfBirth(req: Request, res: Response) {
		const dateOfBirth = req.body.dateOfBirth;

		if (!dateOfBirth) {
			res.status(400).send(new ErrorResult(400, "Missing dateOfBirth"));
			return;
		}

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				DateOfBirth: dateOfBirth,
			}
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				res.send(SecurityHelper.removeMongoId(person));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private showByName(req: Request, res: Response) {
		const firstName = req.query.firstName;
		const lastName = req.query.lastName;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{
				FirstName: firstName,
				LastName: lastName,
			}
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				res.send(SecurityHelper.removeMongoId(person));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private index(req: Request, res: Response): void {
		const personDocuments = this._database.listAllDocuments<Person>(
			this._collectionName
		);

		personDocuments
			.then((persons) => {
				if (persons === null) {
					persons = [];
				}

				res.send(SecurityHelper.removeMongoIds(persons));
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
			const persons = await this._database.listDocumentsPage<Person>(
				this._collectionName,
				page,
				pageSize
			);
			res.send(SecurityHelper.removeMongoIds(persons));
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
			let firstName = req.body.FirstName;
			let lastName = req.body.LastName;
			let relatedDataIds = req.body.RelatedDataIds;
			let familyIds = req.body.FamilyIds;
			let relationshipIds = req.body.RelationshipIds;
			const sex = req.body.Sex ?? req.body.sex;
			const gender = req.body.Gender ?? req.body.gender;
			const events = req.body.Events ?? req.body.events ?? [];

			if (typeof firstName === "string") {
				firstName = firstName.split(" ");
			}

			if (typeof lastName === "string") {
				lastName = lastName.split(" ");
			}

			if (typeof relatedDataIds === "string") {
				relatedDataIds = [relatedDataIds];
			}

			if (typeof familyIds === "string") {
				familyIds = [familyIds];
			}

			if (typeof relationshipIds === "string") {
				relationshipIds = [relationshipIds];
			}

			const person = new Person(
				null,
				firstName,
				lastName,
				sex,
				gender,
				req.body.DateOfBirth,
				req.body.DateOfDeath ?? null,
				req.body.PlaceOfBirth,
				req.body.PlaceOfDeath ?? null,
				relationshipIds,
				req.body.Notes,
				familyIds,
				relatedDataIds,
				events,
				req.body.ReasonOfDeath ?? null // NEU
			);

			await this._database.createDocument<Person>(
				this._collectionName,
				person
			);
			res.send(SecurityHelper.removeMongoId(person));
		} catch (error: any) {
			console.error(error);
			res.status(500).send({ status: 500, message: error.message });
		}
	}

	private show(req: Request, res: Response): void {
		const personDocument = this._database.findDocument<Person>(
			this._collectionName,
			req.params.id
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				res.send(SecurityHelper.removeMongoId(person));
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private async update(req: Request, res: Response): Promise<void> {
		try {
			const person = await this._database.findDocument<Person>(
				this._collectionName,
				req.params.id
			);
			if (!person) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			let firstName = req.body.FirstName ?? person.FirstName;
			let lastName = req.body.LastName ?? person.LastName;
			let relatedDataIds =
				req.body.RelatedDataIds ?? person.RelatedDataIds;
			let familyIds = req.body.FamilyIds ?? person.FamilyIds;
			let relationshipIds =
				req.body.RelationshipIds ?? person.RelationshipIds;
			const sex = req.body.Sex ?? req.body.sex ?? person.Sex;
			const gender = req.body.Gender ?? req.body.gender ?? person.Gender;
			const events =
				req.body.Events ?? req.body.events ?? person.Events ?? [];

			if (typeof firstName === "string") {
				firstName = firstName.split(" ");
			}

			if (typeof lastName === "string") {
				lastName = lastName.split(" ");
			}

			if (typeof relatedDataIds === "string") {
				relatedDataIds = [relatedDataIds];
			}

			if (typeof familyIds === "string") {
				familyIds = [familyIds];
			}

			if (typeof relationshipIds === "string") {
				relationshipIds = [relationshipIds];
			}

			const updatedPerson = new Person(
				person.Id,
				firstName,
				lastName,
				sex,
				gender,
				req.body.DateOfBirth ?? person.DateOfBirth,
				req.body.DateOfDeath ?? person.DateOfDeath,
				escapeHtml(req.body.PlaceOfBirth ?? person.PlaceOfBirth),
				req.body.PlaceOfDeath
					? escapeHtml(req.body.PlaceOfDeath)
					: person.PlaceOfDeath,
				relationshipIds,
				escapeHtml(req.body.Notes ?? person.Notes),
				familyIds,
				relatedDataIds,
				events,
				req.body.ReasonOfDeath
					? escapeHtml(req.body.ReasonOfDeath)
					: person.ReasonOfDeath
			);

			await this._database.updateDocument(
				this._collectionName,
				{ Id: updatedPerson.Id },
				updatedPerson
			);
			res.status(200).send(SecurityHelper.removeMongoId(updatedPerson));
		} catch (error) {
			console.error(error);
			res.status(500).send(new ErrorResult(500));
		}
	}

	private delete(req: Request, res: Response): void {
		const id = req.params.id;
		const personDocument = this._database.findDocument<Person>(
			this._collectionName,
			id
		);

		personDocument
			.then((person) => {
				if (person === null || person === undefined) {
					res.status(404).send(
						new ErrorResult(404, "Person not found")
					);
					return;
				}
				this._database
					.deleteDocument(this._collectionName, person)
					.then((result) => {
						if (!result) {
							res.status(500).send(
								new ErrorResult(500, "Failed to delete person")
							);
							return;
						}
						res.status(200).send({
							success: true,
							message: `Person ${person.Id} deleted successfully`,
						});
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
	 * Lädt eine Mediendatei für eine Person hoch und verknüpft sie
	 * Hinweis: Für File-Upload muss express-fileupload oder multer als Middleware im Server eingebunden sein!
	 */
	private async uploadMedia(req: Request, res: Response): Promise<void> {
		const personId = req.params.id;
		// @ts-ignore
		const files = req.files as any;
		if (!files || !files.file) {
			res.status(400).send(
				new ErrorResult(400, "No file uploaded.")
			);
			return;
		}
		const file = files.file;
		const relatedData = new RelatedData(file.data, file.name, [personId]);
		try {
			await this._database.createDocument(
				DatabaseCollectionEnum.DATA,
				relatedData
			);
			const person = (await this._database.findDocument(
				DatabaseCollectionEnum.PERSONS,
				personId
			)) as any;
			if (person) {
				person.RelatedDataIds = person.RelatedDataIds || [];
				person.RelatedDataIds.push(relatedData.Id);
				await this._database.updateDocument(
					DatabaseCollectionEnum.PERSONS,
					{ Id: personId },
					person
				);
			}
			res.status(200).send({ success: true, mediaId: relatedData.Id });
		} catch (error: any) {
			res.status(500).send(new ErrorResult(500, error.message));
		}
	}

	/**
	 * Taggt weitere Personen auf einem Medium (RelatedData)
	 */
	private async tagMedia(req: Request, res: Response): Promise<void> {
		const personId = req.params.id;
		const { mediaId, taggedPersonIds } = req.body;
		if (!mediaId || !Array.isArray(taggedPersonIds)) {
			res.status(400).send(
				new ErrorResult(400, "mediaId or taggedPersonIds are missing.")
			);
			return;
		}
		try {
			const media = (await this._database.findDocument(
				DatabaseCollectionEnum.DATA,
				mediaId
			)) as any;
			if (!media) {
				res.status(404).send(
					new ErrorResult(404, "Media not found.")
				);
				return;
			}
			media.TaggedPersonsIds = Array.from(
				new Set([
					...(media.TaggedPersonsIds || []),
					personId,
					...taggedPersonIds,
				])
			);
			await this._database.updateDocument(
				DatabaseCollectionEnum.DATA,
				{ Id: mediaId },
				media
			);
			res.status(200).send({
				success: true,
				mediaId,
				taggedPersonIds: media.TaggedPersonsIds,
			});
		} catch (error: any) {
			res.status(500).send(new ErrorResult(500, error.message));
		}
	}
}
