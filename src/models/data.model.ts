import crypto from "crypto";
import { Blob, File } from "buffer";
import { IModel } from "../interfaces/model.interface";

/**
 * Related data model
 * @class
 * @implements {IModel}
 * @property {string} id - Related data id
 * @property {string | Blob | File} relatedData - Related data
 * @property {string} notes - Notes
 * @property {string[]} taggedPersonsIds - Tagged persons ids
 * @constructor
 * @param {string | Blob | File} relatedData - Related data
 * @param {string} notes - Notes
 * @param {string[]} taggedPersonsIds - Tagged persons ids
 * @returns {RelatedData} - Related data instance
 * @example
 * const relatedData = new RelatedData(
 * 	"Related data",
 * 	"Notes",
 * 	["1", "2"]
 * );
 */
export default class RelatedData implements IModel {
	// Properties
	public readonly Id: string;
	public RelatedData: string | Blob | File;
	public Notes: string;
	public TaggedPersonsIds: string[];

	// Constructor
	constructor(
		relatedData: string | Blob | File,
		notes: string,
		taggedPersonsIds: string[]
	) {
		this.Id = crypto.randomUUID();
		this.RelatedData = relatedData;
		this.Notes = notes;
		this.TaggedPersonsIds = taggedPersonsIds;
	}
}
