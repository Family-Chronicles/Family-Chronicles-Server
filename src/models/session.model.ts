import { IModel } from "../interfaces/model.interface.js";

/** A login on one device. The refresh token is only stored as hash. */
export interface Session extends IModel {
	UserId: string;
	TokenHash: string;
	ExpiresAt: string;
	CreatedAt: string;
	LastUsedAt: string;
}

/** A pending password reset. The token is only stored as hash. */
export interface PasswordReset extends IModel {
	UserId: string;
	TokenHash: string;
	ExpiresAt: string;
	CreatedAt: string;
}
