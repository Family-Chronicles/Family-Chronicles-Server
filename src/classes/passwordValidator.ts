/**
 * Passwort-Validierungsklasse
 * Prüft Passwörter auf Sicherheitsanforderungen
 */
export interface PasswordValidationResult {
	isValid: boolean;
	errors: string[];
}

export interface PasswordRequirements {
	minLength: number;
	requireUppercase: boolean;
	requireLowercase: boolean;
	requireNumbers: boolean;
	requireSpecialChars: boolean;
}

export default class PasswordValidator {
	private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
		minLength: 8,
		requireUppercase: true,
		requireLowercase: true,
		requireNumbers: true,
		requireSpecialChars: true,
	};

	private static readonly SPECIAL_CHARS = /[^A-Za-z0-9\s]/;

	/**
	 * Validiert ein Passwort gegen die definierten Anforderungen
	 * @param password - Das zu validierende Passwort
	 * @param requirements - Optionale benutzerdefinierte Anforderungen
	 * @returns Validierungsergebnis mit Fehlermeldungen
	 */
	public static validate(
		password: string,
		requirements: Partial<PasswordRequirements> = {}
	): PasswordValidationResult {
		const reqs = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
		const errors: string[] = [];

		if (!password || password.length < reqs.minLength) {
			errors.push(
				`Passwort muss mindestens ${reqs.minLength} Zeichen lang sein.`
			);
		}

		if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
			errors.push(
				"Passwort muss mindestens einen Großbuchstaben enthalten."
			);
		}

		if (reqs.requireLowercase && !/[a-z]/.test(password)) {
			errors.push(
				"Passwort muss mindestens einen Kleinbuchstaben enthalten."
			);
		}

		if (reqs.requireNumbers && !/[0-9]/.test(password)) {
			errors.push("Passwort muss mindestens eine Zahl enthalten.");
		}

		if (reqs.requireSpecialChars && !this.SPECIAL_CHARS.test(password)) {
			errors.push(
				"Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\\':\\\"\\\\|,.<>/?)."
			);
		}

		// Prüfung auf häufig verwendete, unsichere Passwörter
		if (this.isCommonPassword(password)) {
			errors.push(
				"Dieses Passwort ist zu häufig verwendet und unsicher."
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Prüft, ob ein Passwort in der Liste häufiger Passwörter ist
	 */
	private static isCommonPassword(password: string): boolean {
		const commonPasswords = [
			"password",
			"123456",
			"12345678",
			"qwerty",
			"abc123",
			"monkey",
			"1234567",
			"letmein",
			"trustno1",
			"dragon",
			"baseball",
			"iloveyou",
			"master",
			"sunshine",
			"ashley",
			"football",
			"password1",
			"shadow",
			"123123",
			"654321",
			"password123",
			"admin",
			"admin123",
			"root",
			"changeme",
		];
		return commonPasswords.includes(password.toLowerCase());
	}

	/**
	 * Generiert einen Hinweis zur Passwortstärke
	 */
	public static getStrengthHint(password: string): string {
		let strength = 0;

		if (password.length >= 8) strength++;
		if (password.length >= 12) strength++;
		if (password.length >= 16) strength++;
		if (/[A-Z]/.test(password)) strength++;
		if (/[a-z]/.test(password)) strength++;
		if (/[0-9]/.test(password)) strength++;
		if (this.SPECIAL_CHARS.test(password)) strength++;

		if (strength <= 2) return "Schwach";
		if (strength <= 4) return "Mittel";
		if (strength <= 6) return "Stark";
		return "Sehr stark";
	}
}
