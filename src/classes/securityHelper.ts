import escapeHtml from "escape-html";
import User from "../models/user.model";

/**
 * Sicherheits-Hilfsklasse zum Entfernen sensibler Daten aus Objekten
 */
export default class SecurityHelper {
	/**
	 * HTML-escapet einen String oder gibt leeren String zurück wenn undefined
	 * @param value Der zu escapende String
	 * @returns Escaped String oder leerer String
	 */
	private static escapeString(value: string | undefined | null): string {
		if (!value) return "";
		return escapeHtml(value);
	}

	/**
	 * Entfernt sensible Daten aus einem User-Objekt für sichere API-Responses
	 * @param user Das User-Objekt
	 * @returns Ein sicheres User-Objekt ohne Passwort, SessionID und SessionCreatedAt
	 */
	public static sanitizeUser(user: User): Partial<User> {
		const safeUser = { ...(user as any) };
		delete safeUser.Password;
		delete safeUser.SessionID;
		delete safeUser.SessionCreatedAt;
		return safeUser;
	}

	/**
	 * Entfernt sensible Daten und escapet HTML-Sonderzeichen für XSS-Schutz
	 * @param user Das User-Objekt
	 * @returns Ein sicheres, HTML-escaped User-Objekt
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
	 * Entfernt sensible Daten aus einem Array von User-Objekten
	 * @param users Array von User-Objekten
	 * @returns Array von sicheren User-Objekten
	 */
	public static sanitizeUsers(users: User[]): Partial<User>[] {
		return users.map((user) => this.sanitizeUser(user));
	}

	/**
	 * Entfernt MongoDB-interne Felder (_id) aus einem Objekt
	 * @param obj Das zu bereinigende Objekt
	 * @returns Das Objekt ohne _id
	 */
	public static removeMongoId<T>(obj: T): T {
		if (!obj) return obj;
		const result = { ...obj } as any;
		delete result._id;
		return result as T;
	}

	/**
	 * Entfernt MongoDB-interne Felder aus einem Array von Objekten
	 * @param arr Das Array
	 * @returns Array ohne _id-Felder
	 */
	public static removeMongoIds<T>(arr: T[]): T[] {
		return arr.map((obj) => this.removeMongoId(obj));
	}

	/**
	 * Kombiniert Sanitisierung von User und MongoDB-IDs mit HTML-Escaping
	 * Entfernt sensible Daten, MongoDB-IDs und escapet String-Felder für XSS-Schutz
	 * @param user Das User-Objekt
	 * @returns Sicheres User-Objekt ohne sensible Daten und _id, mit escaped Strings
	 */
	public static sanitizeUserFull(user: User): Partial<User> {
		const sanitized = this.sanitizeUserWithEscape(user);
		return this.removeMongoId(sanitized);
	}

	/**
	 * Kombiniert Sanitisierung für ein Array von Usern
	 * @param users Array von User-Objekten
	 * @returns Array von sicheren User-Objekten
	 */
	public static sanitizeUsersFull(users: User[]): Partial<User>[] {
		return users.map((user) => this.sanitizeUserFull(user));
	}
}
