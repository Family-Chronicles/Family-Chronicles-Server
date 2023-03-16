import { IModel } from "../interfaces/model.interface";
import crypto from "crypto";

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
 * 	new Date(),
 * 	null,
 * 	"New York",
 * 	null,
 * 	[],
 * 	"",
 * 	[],
 * 	[]
 * );
 */
export class Person implements IModel {
	// Properties
	public readonly id: string;
	public firstName: string[];
	public lastName: string[];
	public dateOfBirth: Date;
	public dateOfDeath: Date | null;
	public placeOfBirth: string;
	public placeOfDeath: string | null;
	public relationshipIds: string[];
	public notes: string;
	public familyIds: string[];
	public relatedDataIds: string[];

	// Constructor
	constructor(
		id: string | null | undefined,
		firstName: string[],
		lastName: string[],
		dateOfBirth: Date,
		dateOfDeath: Date | null,
		placeOfBirth: string,
		placeOfDeath: string | null,
		relationshipIds: string[],
		notes: string,
		familyIds: string[],
		relatedDataIds: string[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.firstName = firstName;
		this.lastName = lastName;
		this.dateOfBirth = dateOfBirth;
		this.dateOfDeath = dateOfDeath;
		this.placeOfBirth = placeOfBirth;
		this.placeOfDeath = placeOfDeath;
		this.relationshipIds = relationshipIds;
		this.notes = notes;
		this.familyIds = familyIds;
		this.relatedDataIds = relatedDataIds;
	}
}
