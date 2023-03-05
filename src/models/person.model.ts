import { IModel } from "../interfaces/model.interface";

export class Person implements IModel {
	// Properties
	public readonly id: string;
	public firstName: string[];
	public lastName: string[];
	public dateOfBirth: Date;
	public dateOfDeath: Date | null;
	public placeOfBirth: string;
	public placeOfDeath: string | null;
	public relationshipIds: string[];
	public notes: string;
	public familyIds: string[];
	public relatedDataIds: string[];

	// Constructor
	constructor(
		id: string | null | undefined,
		firstName: string[],
		lastName: string[],
		dateOfBirth: Date,
		dateOfDeath: Date | null,
		placeOfBirth: string,
		placeOfDeath: string | null,
		relationshipIds: string[],
		notes: string,
		familyIds: string[],
		relatedDataIds: string[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.firstName = firstName;
		this.lastName = lastName;
		this.dateOfBirth = dateOfBirth;
		this.dateOfDeath = dateOfDeath;
		this.placeOfBirth = placeOfBirth;
		this.placeOfDeath = placeOfDeath;
		this.relationshipIds = relationshipIds;
		this.notes = notes;
		this.familyIds = familyIds;
		this.relatedDataIds = relatedDataIds;
	}
}
