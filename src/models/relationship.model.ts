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
export default class Relationship implements IModel {
	// Properties
	public readonly Id: string;
	public RelationPartnerOneId: string;
	public RelationPartnerTwoId: string;
	public RelationshipType: RelationshipType;
	public Notes: string;

	// Constructor
	constructor(
		id: string | null | undefined,
		relationPartnerOneId: string,
		relationPartnerTwoId: string,
		relationshipType: RelationshipType,
		notes: string
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = crypto.randomUUID();
		} else {
			this.Id = id;
		}
		this.RelationPartnerOneId = relationPartnerOneId;
		this.RelationPartnerTwoId = relationPartnerTwoId;
		this.RelationshipType = relationshipType;
		this.Notes = notes;
	}
}
