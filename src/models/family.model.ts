import { IModel } from "../interfaces/model.interface.js";
import crypto from "crypto";

/**
 * Family model
 * @class
 * @implements {IModel}
 * @property {string} id - Family id
 * @property {string} Name - Family name
 * @property {string} Description - Family description
 * @property {string} Notes - Family notes
 * @property {string[]} HistoricalNames - Family historical names
 * @constructor
 * @param {string | null | undefined} id - Family id
 * @param {string} Name - Family name
 * @param {string} Description - Family description
 * @param {string} Notes - Family notes
 * @param {string[]} HistoricalNames - Family historical names
 * @returns {Family} - Family instance
 * @example
 * const family = new Family(
 * 	null,
 * 	"Smith",
 * 	"Smith family",
 * 	"Notes",
 * 	["Smiths", "Smythe"]
 * );
 */
export default class Family implements IModel {
	// Properties
	public readonly Id: string;
	public Name: string;
	public Description: string;
	public Notes: string;
	public HistoricalNames: string[];

	// Constructor
	constructor(
		id: string | null | undefined,
		Name: string,
		Description: string,
		Notes: string,
		HistoricalNames: string[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = crypto.randomUUID();
		} else {
			this.Id = id;
		}
		this.Name = Name;
		this.Description = Description;
		this.Notes = Notes;
		this.HistoricalNames = HistoricalNames;
	}
}
