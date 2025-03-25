import { IModel } from "../interfaces/model.interface";
import crypto from "crypto";
import { EventType } from "../types/event.type";

/**
 * Event model
 * @class
 * @implements {IModel}
 * @property {string} Id - Event id
 * @property {EventType} Type - Event type
 * @property {Date} Date - Event date
 * @property {string} Location - Event location
 * @property {number | null} Latitude - Event latitude
 * @property {number | null} Longitude - Event longitude
 * @property {string[]} Participants - Event participants
 * @property {string} Description - Event description
 * @property {string} Notes - Event notes
 * @constructor
 * @param {string | null | undefined} id - Event id
 * @param {EventType} Type - Event type
 * @param {Date} Date - Event date
 * @param {string} Location - Event location
 * @param {number | null} Latitude - Event latitude
 * @param {number | null} Longitude - Event longitude
 * @param {string[]} Participants - Event participants
 * @param {string} Description - Event description
 * @param {string} Notes - Event notes
 * @returns {EventModel} - Event instance
 * @example
 * const event = new EventModel(
 * 	null,
 * 	"Birth",
 * 	new Date(),
 * 	"New York",
 * 	null,
 * 	[],
 * 	"",
 * 	""
 * );
 */
export default class EventModel implements IModel {
	// Properties
	public readonly Id: string;
	public Type: EventType;
	public Date: Date;
	public Location: string;
	public Latitude: number | null;
	public Longitude: number | null;
	public Participants: string[];
	public Description: string;
	public Notes: string;

	// Constructor
	constructor(
		id: string | null | undefined,
		Type: EventType,
		Date: Date,
		Location: string,
		Latitude: number | null,
		Longitude: number | null,
		Participants: string[],
		Description: string,
		Notes: string
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = crypto.randomUUID();
		} else {
			this.Id = id;
		}
		this.Type = Type;
		this.Date = Date;
		this.Location = Location;
		this.Latitude = Latitude;
		this.Longitude = Longitude;
		this.Participants = Participants;
		this.Description = Description;
		this.Notes = Notes;
	}
}
