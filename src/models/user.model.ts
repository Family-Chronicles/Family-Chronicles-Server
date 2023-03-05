import { IModel } from './../interfaces/model.interface';
import { UserType } from "./../types/user.type.js";
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
