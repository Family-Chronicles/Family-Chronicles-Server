import { IModel } from "../interfaces/model.interface.js";
import { RelationshipType } from "../types/relationship.type.js";
import crypto from "crypto";

/**
 * Relationship model
 * @class
 * @implements {IModel}
 * @property {string} id - Relationship id
 * @property {string} relationPartnerOne - Relation partner one
 * @property {string} relationPartnerTwo - Relation partner two
 * @property {RelationshipType} relationshipType - Relationship type
 * @property {string} notes - Notes
 * @constructor
 * @param {string | null | undefined} id - Relationship id
 * @param {string} relationPartnerOne - Relation partner one
 * @param {string} relationPartnerTwo - Relation partner two
 * @param {RelationshipType} relationshipType - Relationship type
 * @param {string} notes - Notes
 * @returns {Relationship} - Relationship instance
 * @example
 * const relationship = new Relationship(
 * 	null,
 * 	"John Doe",
 * 	"Jane Doe",
 * 	RelationshipType.FAMILY,
 * 	"John and Jane are brother and sister"
 * );
 */
export class Relationship implements IModel {
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
