import { UserType } from "./../types/user.type.js";
export class User {
	// Properties
	public readonly id: string;
	public name: string;
	public email: string;
	public password: string;
	public createdAt: Date;
	public updatedAt: Date;
	public UserType: UserType;

	// Constructor
	constructor(
		id: string | null | undefined,
		name: string,
		email: string,
		password: string,
		createdAt: Date,
		updatedAt: Date,
		UserType: UserType
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
		this.UserType = UserType;
	}
}
