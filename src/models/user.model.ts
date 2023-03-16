import { IModel } from "./../interfaces/model.interface";
import { UserType } from "./../types/user.type.js";
import crypto from "crypto";

/**
 * User model
 * @class
 * @implements {IModel}
 * @property {string} id - User id
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {Date} createdAt - User creation date
 * @property {Date} updatedAt - User update date
 * @property {UserType} userType - User type
 * @constructor
 * @param {string | null | undefined} id - User id
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Date} createdAt - User creation date
 * @param {Date} updatedAt - User update date
 * @param {UserType} userType - User type
 * @returns {User} - User instance
 * @example
 * const user = new User(
 * 	null,
 * 	"John Doe",
 * 	"
 * 	"123456",
 * 	new Date(),
 * 	new Date(),
 * 	UserType.ADMIN
 * );
 */
export class User implements IModel {
	// Properties
	public readonly id: string;
	public name: string;
	public email: string;
	public password: string;
	public createdAt: Date;
	public updatedAt: Date;
	public userType: UserType;

	// Constructor
	constructor(
		id: string | null | undefined,
		name: string,
		email: string,
		password: string,
		createdAt: Date,
		updatedAt: Date,
		userType: UserType
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.name = name;
		this.email = email;
		this.password = password;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.userType = userType;
	}
}
