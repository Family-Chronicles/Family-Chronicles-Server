import { IModel } from "../interfaces/model.interface";
import crypto from "crypto";

export class TaggedPerson implements IModel {
	// Properties
	public readonly id: string;
	public personId: string;
	public lat: number | null;
	public lng: number | null;
	public timeStamp: Date | null;
	public notes: string;

	// Constructor
	constructor(
		id: string | null | undefined,
		personId: string,
		lat: number | null,
		lng: number | null,
		timeStamp: Date | null,
		notes: string
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.personId = personId;
		this.lat = lat;
		this.lng = lng;
		this.timeStamp = timeStamp;
		this.notes = notes;
	}
}
