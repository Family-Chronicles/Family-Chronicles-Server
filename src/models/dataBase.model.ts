import RelatedData from "./data.model.js";
import FailedAttemptModel from "./failedAttempts.model.js";
import Family from "./family.model.js";
import Person from "./person.model.js";
import Relationship from "./relationship.model.js";
import TaggedPerson from "./taggedPerson.model.js";
import User from "./user.model.js";

/**
 * Database model
 */
export default class DatabaseModel {
	/**
	 * Familys  of database model
	 */
	public familys: Family[];

	/**
	 * Data  of database model
	 */
	public data: RelatedData[];

	/**
	 * Persons  of database model
	 */
	public persons: Person[];

	/**
	 * Relationships  of database model
	 */
	public relationships: Relationship[];

	/**
	 * Tagged persons of database model
	 */
	public taggedPersons: TaggedPerson[];

	/**
	 * Users  of database model
	 */
	public users: User[];

	/**
	 * Failed attempts of database model
	 */
	public failedAttempts: FailedAttemptModel[];

	/**
	 * Creates an instance of database model.
	 */
	constructor() {
		this.familys = [];
		this.data = [];
		this.persons = [];
		this.relationships = [];
		this.taggedPersons = [];
		this.users = [];
		this.failedAttempts = [];
	}
}
