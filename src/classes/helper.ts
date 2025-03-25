import { H } from "friendly-helper";
import { RelationshipTypeEnum } from "../enums/relationship.enum.js";
import { RoleEnum } from "../enums/role.enum.js";
import RelatedData from "../models/data.model.js";
import Family from "../models/family.model.js";
import Relationship from "../models/relationship.model.js";
import TaggedPerson from "../models/taggedPerson.model.js";
import User from "../models/user.model.js";
import DatabaseService from "../services/database.srvs.js";
import Person from "../models/person.model.js";
import DatabaseModel from "../models/dataBase.model.js";
import { Sex } from "../enums/sex.enum.js";
import EventModel from "../models/event.model.js";

/**
 * Helper
 */
export default class Helper {
	/**
	 * Tests data for the database
	 * @public
	 * @returns {void}
	 * @example
	 * this.testData();
	 * @memberOf Server
	 * @instance
	 * @method
	 * @name testData
	 */
	public static testData(): void {
		const databaseService = DatabaseService.getInstance();

		databaseService.dropCollection("familys");
		databaseService.dropCollection("data");
		databaseService.dropCollection("persons");
		databaseService.dropCollection("relationships");
		databaseService.dropCollection("tags");
		databaseService.dropCollection("users");

		const testData: DatabaseModel = {
			familys: [],
			data: [],
			persons: [],
			relationships: [],
			taggedPersons: [],
			users: [],
			failedAttempts: [],
		};

		for (let index = 0; index < 10; index++) {
			const family = new Family(
				null,
				H.random.generateLastName(),
				"Test Family Description " + index,
				"Test Family Notes " + index,
				[H.random.generateLastName(), H.random.generateLastName()]
			);
			const data = new RelatedData(
				"Test Data " + index,
				"Test Data Description " + index,
				[H.guid.generate(), H.guid.generate()]
			);
			const person = new Person(
				null,
				[H.random.generateFirstName()],
				[H.random.generateLastName()],
				Sex.OTHER,
				"Queer AF",
				new Date(),
				null,
				"Test Person Place of Birth " + index,
				null,
				[H.guid.generate(), H.guid.generate()],
				"Test Person Notes ",
				["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
				[H.guid.generate(), H.guid.generate()],
				[
					new EventModel(
						"isfj",
						"Birth",
						new Date(),
						"New York",
						null,
						null,
						[],
						"",
						""
					),
					new EventModel(
						"isfj",
						"Death",
						new Date(),
						"New York",
						null,
						null,
						[],
						"",
						""
					),
				]
			);
			const relationship = new Relationship(
				null,
				H.guid.generate(),
				H.guid.generate(),
				RelationshipTypeEnum.Related,
				"Test Relationship Notes " + index
			);
			const taggedPerson = new TaggedPerson(
				null,
				H.guid.generate(),
				H.random.generateNumber(1, 10),
				H.random.generateNumber(1, 10),
				H.random.generateDate(new Date(1900, 1, 1), new Date()),
				"Test Tagged Person Notes " + index
			);
			const user = new User(
				null,
				H.random.generateGamerName(),
				H.random.generateEmail(),
				H.random.generatePassword(
					H.random.generateNumber(8, 16),
					[],
					true,
					true
				),
				new Date(),
				new Date(),
				RoleEnum.ADMIN,
				false
			);

			testData.familys.push(family);
			testData.data.push(data);
			testData.persons.push(person);
			testData.relationships.push(relationship);
			testData.taggedPersons.push(taggedPerson);
			testData.users.push(user);
		}

		databaseService.listAllCollections().then((collections) => {
			if (!collections.includes("familys")) {
				databaseService.createCollection("familys");
			}

			if (!collections.includes("data")) {
				databaseService.createCollection("data");
			}

			if (!collections.includes("persons")) {
				databaseService.createCollection("persons");
			}

			if (!collections.includes("relationships")) {
				databaseService.createCollection("relationships");
			}

			if (!collections.includes("tags")) {
				databaseService.createCollection("tags");
			}

			if (!collections.includes("users")) {
				databaseService.createCollection("users");
			}
		});

		databaseService.createDocument("familys", testData.familys[0]);
		databaseService.createDocument("familys", testData.familys[1]);
		databaseService.createDocument("data", testData.data[0]);
		databaseService.createDocument("data", testData.data[1]);
		databaseService.createDocument("persons", testData.persons[0]);
		databaseService.createDocument("persons", testData.persons[1]);
		databaseService.createDocument(
			"relationships",
			testData.relationships[0]
		);
		databaseService.createDocument(
			"relationships",
			testData.relationships[1]
		);
		databaseService.createDocument("tags", testData.taggedPersons[0]);
		databaseService.createDocument("tags", testData.taggedPersons[1]);
		databaseService.createDocument("users", testData.users[0]);
		databaseService.createDocument("users", testData.users[1]);
	}
}
