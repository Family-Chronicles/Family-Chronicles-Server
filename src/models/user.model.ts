import { IModel } from "./../interfaces/model.interface.js";
import { Role } from "../types/role.type.js";
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
 * @param {Role} userType - User type
 * @returns {User} - User instance
 * @example
 * const user = new User(
 * 	null,
 * 	"John Doe",
 * 	"",
 * 	"123456",
 * 	new Date(),
 * 	new Date(),
 * 	UserType.ADMIN
 * );
 */
export default class User implements IModel {
	// Properties
	public readonly Id: string;
	public Name: string;
	public Email: string;
	public Password: string;
	public CreatedAt: Date;
	public UpdatedAt: Date;
	public Role: Role;
	public SessoionID?: string;
	public Locked: boolean;

	// Constructor
	constructor(
		id: string | null | undefined,
		name: string,
		email: string,
		password: string,
		createdAt: Date,
		updatedAt: Date,
		role: Role,
		locked: boolean,
		sessionID?: string
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = crypto.randomUUID();
		} else {
			this.Id = id;
		}
		this.Name = name;
		this.Email = email;
		this.Password = password;
		this.CreatedAt = createdAt;
		this.UpdatedAt = updatedAt;
		this.Role = role;
		this.Locked = locked;
		this.SessoionID = sessionID || undefined;
	}
}
