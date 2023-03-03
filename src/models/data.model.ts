import { TaggedPerson } from "./taggedPerson.model.js";

export class RelatedData {
	// Properties
	public readonly id: string;
	public relatedData: string | Blob | File;
	public notes: string;
	public taggedPersons: TaggedPerson[];

	// Constructor
	constructor(
		relatedData: string | Blob | File,
		notes: string,
		taggedPersons: TaggedPerson[]
	) {
		this.id = crypto.randomUUID();
		this.relatedData = relatedData;
		this.notes = notes;
		this.taggedPersons = taggedPersons;
	}
}
