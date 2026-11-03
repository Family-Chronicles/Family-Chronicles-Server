import { DateString, IModel } from "../interfaces/model.interface.js";

export const RELATIONSHIP_TYPES = [
	"Parent",
	"Child",
	"Spouse",
	"Partner",
	"Sibling",
	"Related",
	"Other",
	"Unknown",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * Directed link between two persons.
 * "Parent" means: `PersonId` is a parent of `RelatedPersonId`.
 * "Child" is stored as "Parent" with swapped persons, so each fact exists once.
 * `Role` is a free text describing the link in detail (e.g. "Mutter", "Stiefvater", "Adoptivkind").
 */
export interface Relationship extends IModel {
	PersonId: string;
	RelatedPersonId: string;
	Type: RelationshipType;
	Role: string;
	StartDate: DateString;
	EndDate: DateString;
	Notes: string;
}
