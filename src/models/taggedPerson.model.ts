import { IModel } from "../interfaces/model.interface";
import crypto from "crypto";

/**
 * TaggedPerson model
 * @class
 * @implements {IModel}
 * @property {string} id - TaggedPerson id
 * @property {string} personId - Person id
 * @property {number | null} lat - Latitude
 * @property {number | null} lng - Longitude
 * @property {Date | null} timeStamp - Time stamp
 * @property {string} notes - Notes
 * @constructor
 * @param {string | null | undefined} id - TaggedPerson id
 * @param {string} personId - Person id
 * @param {number | null} lat - Latitude
 * @param {number | null} lng - Longitude
 * @param {Date | null} timeStamp - Time stamp
 * @param {string} notes - Notes
 * @returns {TaggedPerson} - TaggedPerson instance
 * @example
 * const taggedPerson = new TaggedPerson(
 * 	null,
 * 	"123456",
 * 	-1.2345,
 * 	1.2345,
 * 	new Date(),
 * 	"Notes"
 * );
 */
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
