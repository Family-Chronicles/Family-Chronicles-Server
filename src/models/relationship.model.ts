import { RelationshipType } from "../types/relationship.type";

export class Relationship {
	// Properties
	public readonly id: string;
	public relationPartnerOne: string;
	public relationPartnerTwo: string;
	public relationshipType: RelationshipType;
	public notes: string;

	// Constructor
	constructor(
		id: string | null | undefined,
		relationPartnerOne: string,
		relationPartnerTwo: string,
		relationshipType: RelationshipType,
		notes: string
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.relationPartnerOne = relationPartnerOne;
		this.relationPartnerTwo = relationPartnerTwo;
		this.relationshipType = relationshipType;
		this.notes = notes;
	}
}