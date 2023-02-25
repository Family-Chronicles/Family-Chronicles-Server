import { TaggedPerson } from "./taggedPerson.model";

export class RelatedData {

	// Properties
	id: string;
	relatedData: string | Blob | File;
	notes: string;
	taggedPersons: TaggedPerson[];

	// Constructor
	constructor(
		id: string,
		relatedData: string | Blob | File,
		notes: string,
		taggedPersons: TaggedPerson[]
	) {
		this.id = id;
		this.relatedData = relatedData;
		this.notes = notes;
		this.taggedPersons = taggedPersons;
	}
}
