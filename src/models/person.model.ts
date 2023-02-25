import { RelatedData } from "./data.model";
import { Family } from "./family.model";
import { Relationship } from "./relationship.model";

export class Person {

	// Properties
	public id: string;
	public firstName: string[];
	public lastName: string[];
	public dateOfBirth: Date;
	public dateOfDeath: Date | null;
	public placeOfBirth: string;
	public placeOfDeath: string | null;
	public relationships: Relationship[];
	public notes: string;
	public familys: Family[];
	public relatedData: RelatedData[];

	// Constructor
	constructor(
		id: string,
		firstName: string[],
		lastName: string[],
		dateOfBirth: Date,
		dateOfDeath: Date | null,
		placeOfBirth: string,
		placeOfDeath: string | null,
		relationships: Relationship[],
		notes: string,
		familys: Family[],
		relatedData: RelatedData[]
	) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
		this.dateOfBirth = dateOfBirth;
		this.dateOfDeath = dateOfDeath;
		this.placeOfBirth = placeOfBirth;
		this.placeOfDeath = placeOfDeath;
		this.relationships = relationships;
		this.notes = notes;
		this.familys = familys;
		this.relatedData = relatedData;
	}
}
