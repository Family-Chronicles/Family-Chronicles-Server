import NodeRSA from "node-rsa";
import PasswordValidator from "../classes/passwordValidator";

/**
 * Ergebnis der Passwort-Entschlüsselung und Validierung
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
 * Konfiguration für Passwort-Operationen
 */
export interface PasswordOperationConfig {
	/** RSA-Schlüssel für Entschlüsselung */
	privateKey: string;
	/** Ob Passwort-Stärke validiert werden soll (z.B. bei Passwort-Änderungen) */
	validateStrength?: boolean;
}

/**
 * Entschlüsselt ein RSA-verschlüsseltes Passwort und validiert optional die Passwortstärke.
 * Zentrale Utility-Funktion um DRY zu gewährleisten.
 *
 * @param encryptedPassword - Das verschlüsselte Passwort
 * @param config - Konfiguration mit privatem Schlüssel und Validierungsoptionen
 * @returns Ergebnis mit entschlüsseltem Passwort oder Fehlerinformationen
 *
 * @example
 * // Nur entschlüsseln (z.B. beim Login)
 * const result = decryptPassword(encryptedPw, { privateKey: key });
 *
 * @example
 * // Entschlüsseln und Stärke validieren (z.B. bei Registrierung)
 * const result = decryptPassword(encryptedPw, { privateKey: key, validateStrength: true });
 */
export function decryptPassword(
	encryptedPassword: string,
	config: PasswordOperationConfig
): PasswordDecryptionResult {
	// RSA-Entschlüsselung
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

	// Optionale Passwort-Stärke-Validierung
	if (config.validateStrength) {
		if (!PasswordValidator.validate(decryptedPassword)) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Password does not meet strength requirements",
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
 * Entschlüsselt und validiert ein Passwort für Registrierung/Update-Szenarien.
 * Kurzform für decryptPassword mit aktivierter Stärke-Validierung.
 *
 * @param encryptedPassword - Das verschlüsselte Passwort
 * @param privateKey - RSA Private Key
 * @returns Ergebnis mit entschlüsseltem Passwort oder Fehlerinformationen
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
 * Entschlüsselt ein Passwort ohne Stärke-Validierung (für Login-Szenarien).
 *
 * @param encryptedPassword - Das verschlüsselte Passwort
 * @param privateKey - RSA Private Key
 * @returns Ergebnis mit entschlüsseltem Passwort oder Fehlerinformationen
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
