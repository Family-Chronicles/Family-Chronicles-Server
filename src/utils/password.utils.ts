import NodeRSA from "node-rsa";
import PasswordValidator from "../classes/passwordValidator";

/**
 * Result of password decryption and (optional) strength validation.
 */
export interface PasswordDecryptionResult {
	success: boolean;
	password?: string;
	error?: {
		code: number;
		message: string;
	};
}

/**
 * Configuration for password operations.
 */
export interface PasswordOperationConfig {
	/** RSA private key used for decryption. */
	privateKey: string;
	/** Whether to validate password strength (e.g. on registration or password changes). */
	validateStrength?: boolean;
}

/**
 * Decrypts an RSA-encrypted password and optionally validates its strength.
 * Central utility function to keep password handling DRY.
 *
 * @param encryptedPassword - The base64 RSA-encrypted password.
 * @param config - Configuration with the private key and validation options.
 * @returns Result with the decrypted password or error information.
 *
 * @example
 * // Decrypt only (e.g. on login)
 * const result = decryptPassword(encryptedPw, { privateKey: key });
 *
 * @example
 * // Decrypt and validate strength (e.g. on registration)
 * const result = decryptPassword(encryptedPw, { privateKey: key, validateStrength: true });
 */
export function decryptPassword(
	encryptedPassword: string,
	config: PasswordOperationConfig
): PasswordDecryptionResult {
	// RSA decryption
	let decryptedPassword: string;
	try {
		const key = new NodeRSA(config.privateKey);
		decryptedPassword = key.decrypt(encryptedPassword, "utf8");
	} catch (err) {
		console.error("Password decryption failed:", err);
		return {
			success: false,
			error: {
				code: 400,
				message: "Invalid password format",
			},
		};
	}

	// Optional password-strength validation.
	if (config.validateStrength) {
		const validation = PasswordValidator.validate(decryptedPassword);
		if (!validation.isValid) {
			return {
				success: false,
				error: {
					code: 400,
					message:
						validation.errors.join(" ") ||
						"Password does not meet strength requirements",
				},
			};
		}
	}

	return {
		success: true,
		password: decryptedPassword,
	};
}

/**
 * Decrypts and validates a password for registration/update scenarios.
 * Shorthand for {@link decryptPassword} with strength validation enabled.
 *
 * @param encryptedPassword - The base64 RSA-encrypted password.
 * @param privateKey - RSA private key.
 * @returns Result with the decrypted password or error information.
 */
export function decryptAndValidatePassword(
	encryptedPassword: string,
	privateKey: string
): PasswordDecryptionResult {
	return decryptPassword(encryptedPassword, {
		privateKey,
		validateStrength: true,
	});
}

/**
 * Decrypts a password without strength validation (for login scenarios).
 *
 * @param encryptedPassword - The base64 RSA-encrypted password.
 * @param privateKey - RSA private key.
 * @returns Result with the decrypted password or error information.
 */
export function decryptPasswordOnly(
	encryptedPassword: string,
	privateKey: string
): PasswordDecryptionResult {
	return decryptPassword(encryptedPassword, {
		privateKey,
		validateStrength: false,
	});
}
