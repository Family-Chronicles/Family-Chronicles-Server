import { RelationshipType } from "../types/relationship.type";

export class Relationship {
	// Properties
	public id: string;
	public personId: string;
	public relatedPersonId: string;
	public relationshipType: RelationshipType;
	public notes: string;

	// Constructor
	constructor(
		id: string,
		personId: string,
		relatedPersonId: string,
		relationshipType: RelationshipType,
		notes: string
	) {
		this.id = id;
		this.personId = personId;
		this.relatedPersonId = relatedPersonId;
		this.relationshipType = relationshipType;
		this.notes = notes;
	}
}
