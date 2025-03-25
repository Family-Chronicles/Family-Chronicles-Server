import { Sex } from "../enums/sex.enum.js";
import { IModel } from "../interfaces/model.interface.js";
import crypto from "crypto";
import EventModel from "./event.model.js";

/**
 * Person model
 * @class
 * @implements {IModel}
 * @property {string} id - Person id
 * @property {string[]} firstName - Person first name
 * @property {string[]} lastName - Person last name
 * @property {Date} dateOfBirth - Person date of birth
 * @property {Date | null} dateOfDeath - Person date of death
 * @property {string} placeOfBirth - Person place of birth
 * @property {string | null} placeOfDeath - Person place of death
 * @property {string[]} relationshipIds - Person relationship ids
 * @property {string} notes - Person notes
 * @property {string[]} familyIds - Person family ids
 * @property {string[]} relatedDataIds - Person related data ids
 * @constructor
 * @param {string | null | undefined} id - Person id
 * @param {string[]} firstName - Person first name
 * @param {string[]} lastName - Person last name
 * @param {Date} dateOfBirth - Person date of birth
 * @param {Date | null} dateOfDeath - Person date of death
 * @param {string} placeOfBirth - Person place of birth
 * @param {string | null} placeOfDeath - Person place of death
 * @param {string[]} relationshipIds - Person relationship ids
 * @param {string} notes - Person notes
 * @param {string[]} familyIds - Person family ids
 * @param {string[]} relatedDataIds - Person related data ids
 * @returns {Person} - Person instance
 * @example
 * const person = new Person(
 * 	null,
 * 	["John"],
 * 	["Doe"],
 *  "",
 *  "",
 * 	new Date(),
 * 	null,
 * 	"New York",
 * 	null,
 * 	[],
 * 	"",
 * 	[],
 * 	[],
 * 	[]
 * );
 */
export default class Person implements IModel {
	// Properties
	public readonly Id: string;
	public FirstName: string[];
	public LastName: string[];
	public Sex: Sex;
	public Gender: string;
	public DateOfBirth: Date;
	public DateOfDeath: Date | null;
	public PlaceOfBirth: string;
	public PlaceOfDeath: string | null;
	public RelationshipIds: string[];
	public Notes: string;
	public FamilyIds: string[];
	public RelatedDataIds: string[];
	public Events: EventModel[];

	// Constructor
	constructor(
		id: string | null | undefined,
		firstName: string[],
		lastName: string[],
		sex: Sex,
		gender: string,
		dateOfBirth: Date,
		dateOfDeath: Date | null,
		placeOfBirth: string,
		placeOfDeath: string | null,
		relationshipIds: string[],
		notes: string,
		familyIds: string[],
		relatedDataIds: string[],
		events: EventModel[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = crypto.randomUUID();
		} else {
			this.Id = id;
		}
		this.FirstName = firstName;
		this.LastName = lastName;
		this.Sex = sex;
		this.Gender = gender;
		this.DateOfBirth = dateOfBirth;
		this.DateOfDeath = dateOfDeath;
		this.PlaceOfBirth = placeOfBirth;
		this.PlaceOfDeath = placeOfDeath;
		this.RelationshipIds = relationshipIds;
		this.Notes = notes;
		this.FamilyIds = familyIds;
		this.RelatedDataIds = relatedDataIds;
		this.Events = events ?? [];
	}
}
