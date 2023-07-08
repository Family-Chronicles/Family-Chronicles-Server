import { RelatedData } from "./data.model";
import { Family } from "./family.model";
import { Person } from "./person.model";
import { Relationship } from "./relationship.model";
import { TaggedPerson } from "./taggedPerson.model";
import { User } from "./user.model";

/**
 * Database model
 */
export class DatabaseModel {
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
	 * Creates an instance of database model.
	 */
	constructor() {
		this.familys = [];
		this.data = [];
		this.persons = [];
		this.relationships = [];
		this.taggedPersons = [];
		this.users = [];
	}
}
