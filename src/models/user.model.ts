import { UserType } from "./../types/user.type";
export class User {
	// Properties
	public id: string;
	public name: string;
	public email: string;
	public password: string;
	public createdAt: Date;
	public updatedAt: Date;
	public UserType: UserType;

	// Constructor
	constructor(
		id: string,
		name: string,
		email: string,
		password: string,
		createdAt: Date,
		updatedAt: Date,
		UserType: UserType
	) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.password = password;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.UserType = UserType;
	}
}
