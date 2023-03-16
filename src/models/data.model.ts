import { IModel } from "../interfaces/model.interface.js";
import crypto from "crypto";
import { Blob, File } from "buffer";

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
