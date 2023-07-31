import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import DatabaseService from "../services/database.srvs.js";
import Person from "../models/person.model.js";
import AuthorizationService from "../services/auth.srvs.js";
import bodyParser from "body-parser";
import Relationship from "../models/relationship.model.js";
import ErrorResult from "../models/actionResults/error.result.js";
import Ok from "../models/actionResults/ok.result.js";
import { RelationshipTypeEnum } from "../enums/relationship.enum.js";
import { DatabaseCollectionEnum } from "../enums/databaseCollection.enum.js";

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
			this._authorization.authorize(req, res, () => {
				this.index(req, res);
			});
		});

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
		app.get("/person/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.show(req, res);
			});
		});

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
				this._authorization.authorize(req, res, () => {
					this.showByName(req, res);
				});
			}
		);

		/**
		 * GET /person/dateOfBirth/:dateOfBirth
		 * @tags persons
		 * @summary This returns persons by date of birth
		 * @security BearerAuth
		 * @param {string} dateOfBirth.path.required - the date of birth of the person
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
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4b"
		 * }]
		 */
		app.get(
			"/person/dateOfBirth/:dateOfBirth",
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.showByDateOfBirth(req, res);
				});
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
		 * 	"Id": "60f3b3b0-0b0a-4f4a-8b0a-4f4a8b0a4f4b"
		 * }]
		 */
		app.get(
			"/person/relatedData/:relatedDataIds",
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.showByRelatedDataIds(req, res);
				});
			}
		);

		/**
		 * POST /person
		 * @tags persons
		 * @summary This a new person and saves it to the database
		 * @security BearerAuth
		 * @param {object} - the new person - application/json
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
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.create(req, res);
				});
			}
		);

		/**
		 * PUT /person/:id
		 * @tags persons
		 * @summary This updates a person by id
		 * @security BearerAuth
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
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.update(req, res);
				});
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
		app.delete("/person/:id", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.delete(req, res);
			});
		});

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
		app.get("/person/:id/relationships", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.showRelationships(req, res);
			});
		});

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
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.showRelationship(req, res);
				});
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
		app.post("/person/:id/relationship", (req: Request, res: Response) => {
			this._authorization.authorize(req, res, () => {
				this.addRelationship(req, res);
			});
		});

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
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	 status: 200
		 * }
		 */
		app.put(
			"/person/:id/relationships/:relationshipId",
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.updateRelationship(req, res);
				});
			}
		);

		/**
		 * DELETE /person/:id/relationships/:relationshipId
		 * @tags persons
		 * @summary This deletes a relationship of a person by id
		 * @security BearerAuth
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	 status: 200
		 * }
		 */
		app.delete(
			"/person/:id/relationships/:relationshipId",
			(req: Request, res: Response) => {
				this._authorization.authorize(req, res, () => {
					this.deleteRelationship(req, res);
				});
			}
		);
	}

	private deleteRelationship(req: Request, res: Response) {
		const id = req.params.id;
		const relationshipId = req.params.relationshipId;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{ Id: id }
		);

		personDocument.then((persons) => {
			if (persons.length === 0) {
				res.status(404).send(new ErrorResult(404, "Person not found"));
				return;
			}

			const person = persons[0];

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
					{ Id: relationshipId }
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

		const realtionship = JSON.parse(req.body.relationship) as Relationship;

		const resultRelation = new Relationship(
			relationshipId,
			id,
			realtionship.RelationPartnerTwoId ?? "",
			realtionship.RelationshipType ?? RelationshipTypeEnum.Unknown,
			realtionship.Notes ?? ""
		);

		if (resultRelation.RelationPartnerTwoId === "") {
			res.status(400).send(
				new ErrorResult(400, "Missing RelationPartnerTwoId")
			);
			return;
		}

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{ Id: id }
		);

		personDocument.then((persons) => {
			if (persons === null || persons.length === 0) {
				res.status(404).send(new ErrorResult(404, "Person not found"));
				return;
			}

			const relationshipDocument =
				this._database.getDocumentByQuery<Relationship>(
					this._collectionName,
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
						this._collectionName,
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
		const realtionship = JSON.parse(req.body.relationship) as Relationship;

		const resultRelation = new Relationship(
			null,
			id,
			realtionship.RelationPartnerTwoId ?? "",
			realtionship.RelationshipType ?? RelationshipTypeEnum.Unknown,
			realtionship.Notes ?? ""
		);

		if (resultRelation.RelationPartnerTwoId === "") {
			res.status(400).send(
				new ErrorResult(400, "Missing RelationPartnerTwoId")
			);
			return;
		}

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{ Id: id }
		);

		personDocument.then((persons) => {
			if (persons === null || persons.length === 0) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const person = persons[0];

			if (
				person.RelationshipIds === undefined ||
				person.RelationshipIds === null
			) {
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
			{ Id: id }
		);

		personDocument.then((person) => {
			if (person === null) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const relationshipIds = person[0].RelationshipIds;

			if (relationshipIds === undefined || relationshipIds === null) {
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
				if (relationship === null) {
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
			{ Id: id }
		);

		personDocument.then((person) => {
			if (person === null) {
				res.status(404).send(new ErrorResult(404));
				return;
			}

			const relationshipIds = person[0].RelationshipIds;

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
			{ RelatedDataIds: { $in: relatedDataIds } }
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private showByDateOfBirth(req: Request, res: Response) {
		const dateOfBirth = req.params.dateOfBirth;

		const personDocument = this._database.getDocumentByQuery<Person>(
			this._collectionName,
			{ DateOfBirth: dateOfBirth }
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
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
			{ FirstName: firstName, LastName: lastName }
		);

		personDocument
			.then((person) => {
				if (person === null) {
					res.status(404).send(new ErrorResult(404));
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
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

				persons.forEach((person) => {
					//@ts-ignore
					delete person._id;
				});

				res.send(persons);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private create(req: Request, res: Response): void {
		console.log(req.body);

		let firstName = req.body.FirstName;
		let lastName = req.body.LastName;
		let relatedDataIds = req.body.RelatedDataIds;
		let familyIds = req.body.FamilyIds;
		let relationshipIds = req.body.RelationshipIds;

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
			req.body.sex,
			req.body.gender,
			req.body.DateOfBirth,
			req.body.DateOfDeath ?? null,
			req.body.PlaceOfBirth,
			req.body.PlaceOfDeath ?? null,
			relatedDataIds,
			req.body.Notes,
			familyIds,
			relationshipIds
		);

		this._database
			.createDocument<Person>(this._collectionName, person)
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500, message: error.message });
			});

		res.send(person);
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
				//@ts-ignore
				delete person!._id;
				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send(new ErrorResult(500));
			});
	}

	private update(req: Request, res: Response): void {
		const personDocument = this._database.findDocument<Person>(
			this._collectionName,
			req.params.id
		);

		personDocument
			.then((person) => {
				if (person === null || person === undefined) {
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
					req.body.sex,
					req.body.gender,
					req.body.DateOfBirth ?? person.DateOfBirth,
					req.body.DateOfDeath ?? person.DateOfDeath,
					req.body.PlaceOfBirth ?? person.PlaceOfBirth,
					req.body.PlaceOfDeath ?? person.PlaceOfDeath,
					relationshipIds,
					req.body.Notes ?? person.Notes,
					familyIds,
					relatedDataIds
				);

				const result = JSON.stringify(updatedPerson);

				this._database
					.updateDocument(
						this._collectionName,
						personDocument,
						updatedPerson
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
		const personDocument = this._database.findDocument<Person>(
			this._collectionName,
			req.path.split("/")[2]
		);

		personDocument
			.then((person) => {
				if (person === null || person === undefined) {
					res.status(404).send(new ErrorResult(404));
					return;
				}
				this._database
					.deleteDocument(this._collectionName, person)
					.then(() => {
						res.status(200).send(
							new Ok(
								`User ${
									person.FirstName + " " + person.LastName
								} with id ${person.Id} deleted successfully`
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
