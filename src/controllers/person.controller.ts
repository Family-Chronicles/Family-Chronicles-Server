import { Express, Request, Response } from "express";
import { IController } from "../interfaces/controller.interface.js";
import { DatabaseService } from "../services/database.srvs.js";
import { Person } from "../models/person.model.js";
import { AuthorizationService } from "../services/auth.srvs.js";
import bodyParser from "body-parser";

export class PersonController implements IController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();
	private _collectionName = "persons";
	/**
	 * Routes person controller
	 * @param app
	 */
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
		 * @return {object} 200 - success response - application/json
		 * @example response - 200 - success response example
		 * {
		 * 	"FirstName": ["John"],
		 * 	"LastName": ["Doe"],
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
					res.status(404).send({ status: 404 });
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
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
					res.status(404).send({ status: 404 });
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
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
					res.status(404).send({ status: 404 });
					return;
				}

				//@ts-ignore
				delete person._id;

				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
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
				res.status(500).send({ status: 500 });
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
					res.status(404).send({ status: 404 });
					return;
				}
				//@ts-ignore
				delete person!._id;
				res.send(person);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
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
					res.status(404).send({ status: 404 });
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
						res.status(500).send({ status: 500 });
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ status: 500 });
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
					res.status(404).send({ status: 404 });
					return;
				}
				this._database
					.deleteDocument(this._collectionName, person)
					.then(() => {
						res.status(200).send({
							success: true,
							message: `User ${
								person.FirstName + " " + person.LastName
							} with id ${person.Id} deleted successfully`,
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
