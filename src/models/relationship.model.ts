import { RelationshipType } from "../types/relationship.type";

export class Relationship {
	// Properties
	id: string;
	relationPartnerOne: string;
	relationPartnerTwo: string;
	relationshipType: RelationshipType;
	notes: string;

	// Constructor
	constructor(
		id: string,
		relationPartnerOne: string,
		relationPartnerTwo: string,
		relationshipType: RelationshipType,
		notes: string
	) {
		this.id = id;
		this.relationPartnerOne = relationPartnerOne;
		this.relationPartnerTwo = relationPartnerTwo;
		this.relationshipType = relationshipType;
		this.notes = notes;
	}
}
