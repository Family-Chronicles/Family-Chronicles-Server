import { IModel } from "../interfaces/model.interface.js";

export const ROLES = ["Admin", "Editor", "Viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Stored user, including the password hash. Never send this to clients. */
export interface User extends IModel {
	Name: string;
	Email: string;
	PasswordHash: string;
	Role: Role;
	CreatedAt: string;
	UpdatedAt: string;
}

/** User as returned by the API */
export type PublicUser = Omit<User, "PasswordHash">;

export function toPublicUser(user: User): PublicUser {
	const { PasswordHash, ...rest } = user;
	return rest;
}
