import escapeHtml from "escape-html";
import User from "../models/user.model";

/**
 * Security helper class for stripping sensitive data from objects.
 */
export default class SecurityHelper {
	/**
	 * HTML-escapes a string, or returns an empty string when the value is undefined.
	 * @param value The string to escape
	 * @returns Escaped string, or an empty string
	 */
	private static escapeString(value: string | undefined | null): string {
		if (!value) return "";
		return escapeHtml(value);
	}

	/**
	 * Removes sensitive data from a user object for safe API responses.
	 * @param user The user object
	 * @returns A safe user object without Password, SessionID and SessionCreatedAt
	 */
	public static sanitizeUser(user: User): Partial<User> {
		const safeUser = { ...(user as any) };
		delete safeUser.Password;
		delete safeUser.SessionID;
		delete safeUser.SessionCreatedAt;
		return safeUser;
	}

	/**
	 * Removes sensitive data and escapes HTML special characters for XSS protection.
	 * @param user The user object
	 * @returns A safe, HTML-escaped user object
	 */
	public static sanitizeUserWithEscape(user: User): Partial<User> {
		const sanitized = this.sanitizeUser(user);
		return {
			...sanitized,
			Name: this.escapeString(sanitized.Name as string | undefined),
			Email: this.escapeString(sanitized.Email as string | undefined),
		};
	}

	/**
	 * Removes sensitive data from an array of user objects.
	 * @param users Array of user objects
	 * @returns Array of safe user objects
	 */
	public static sanitizeUsers(users: User[]): Partial<User>[] {
		return users.map((user) => this.sanitizeUser(user));
	}

	/**
	 * Removes MongoDB-internal fields (_id) from an object.
	 * @param obj The object to clean
	 * @returns The object without _id
	 */
	public static removeMongoId<T>(obj: T): T {
		if (!obj) return obj;
		const result = { ...obj } as any;
		delete result._id;
		return result as T;
	}

	/**
	 * Removes MongoDB-internal fields from an array of objects.
	 * @param arr The array
	 * @returns Array without _id fields
	 */
	public static removeMongoIds<T>(arr: T[]): T[] {
		return arr.map((obj) => this.removeMongoId(obj));
	}

	/**
	 * Combines user sanitization and MongoDB-id removal with HTML escaping.
	 * Removes sensitive data and _id, and escapes string fields for XSS protection.
	 * @param user The user object
	 * @returns Safe user object without sensitive data and _id, with escaped strings
	 */
	public static sanitizeUserFull(user: User): Partial<User> {
		const sanitized = this.sanitizeUserWithEscape(user);
		return this.removeMongoId(sanitized);
	}

	/**
	 * Combines sanitization for an array of users.
	 * @param users Array of user objects
	 * @returns Array of safe user objects
	 */
	public static sanitizeUsersFull(users: User[]): Partial<User>[] {
		return users.map((user) => this.sanitizeUserFull(user));
	}
}
