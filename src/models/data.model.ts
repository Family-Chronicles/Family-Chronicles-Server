import { IModel } from "../interfaces/model.interface.js";
import crypto from "crypto";
import { Blob, File } from "buffer";

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
export class RelatedData implements IModel {
	// Properties
	public readonly id: string;
	public relatedData: string | Blob | File;
	public notes: string;
	public taggedPersonsIds: string[];

	// Constructor
	constructor(
		relatedData: string | Blob | File,
		notes: string,
		taggedPersonsIds: string[]
	) {
		this.id = crypto.randomUUID();
		this.relatedData = relatedData;
		this.notes = notes;
		this.taggedPersonsIds = taggedPersonsIds;
	}
}
