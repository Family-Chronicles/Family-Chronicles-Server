/**
 * Result of a password validation run.
 */
export interface PasswordValidationResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Configurable password security requirements.
 */
export interface PasswordRequirements {
	minLength: number;
	requireUppercase: boolean;
	requireLowercase: boolean;
	requireNumbers: boolean;
	requireSpecialChars: boolean;
}

/**
 * Password validation class.
 * Checks passwords against configurable security requirements.
 */
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
	 * Validates a password against the configured requirements.
	 * @param password - The password to validate.
	 * @param requirements - Optional custom requirements that override the defaults.
	 * @returns Validation result with a list of human-readable error messages.
	 */
	public static validate(
		password: string,
		requirements: Partial<PasswordRequirements> = {}
	): PasswordValidationResult {
		const reqs = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
		const errors: string[] = [];

		if (!password || password.length < reqs.minLength) {
			errors.push(
				`Password must be at least ${reqs.minLength} characters long.`
			);
		}

		if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
			errors.push("Password must contain at least one uppercase letter.");
		}

		if (reqs.requireLowercase && !/[a-z]/.test(password)) {
			errors.push("Password must contain at least one lowercase letter.");
		}

		if (reqs.requireNumbers && !/[0-9]/.test(password)) {
			errors.push("Password must contain at least one number.");
		}

		if (reqs.requireSpecialChars && !this.SPECIAL_CHARS.test(password)) {
			errors.push(
				"Password must contain at least one special character (e.g. !@#$%^&*)."
			);
		}

		// Reject commonly used, insecure passwords.
		if (this.isCommonPassword(password)) {
			errors.push("This password is too common and therefore insecure.");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Checks whether a password is part of a small denylist of common passwords.
	 */
	private static isCommonPassword(password: string): boolean {
		if (!password) {
			return false;
		}

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
	 * Returns a coarse, human-readable strength label for a password.
	 * Intended as a UI hint, not as the authoritative validation check.
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

		if (strength <= 2) return "Weak";
		if (strength <= 4) return "Medium";
		if (strength <= 6) return "Strong";
		return "Very strong";
	}
}
