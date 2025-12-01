/**
 * Sicherheitsbezogene Konstanten
 * Zentrale Konfiguration für Authentifizierung und Autorisierung
 */
export const SecurityConstants = {
	/**
	 * Maximale Anzahl fehlgeschlagener Anmeldeversuche vor temporärer Sperrung
	 */
	MAX_LOGIN_ATTEMPTS: 5,

	/**
	 * Dauer der temporären Sperrung in Millisekunden (15 Minuten)
	 */
	LOCKOUT_DURATION_MS: 15 * 60 * 1000,

	/**
	 * Schwellenwert für permanente Kontosperrung (Faktor von MAX_LOGIN_ATTEMPTS)
	 */
	PERMANENT_LOCK_MULTIPLIER: 3,

	/**
	 * Session-Timeout in Millisekunden (Standard: 24 Stunden, überschreibbar durch Config)
	 */
	SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,

	/**
	 * Verzögerung für Timing-Attack-Schutz in Millisekunden
	 */
	TIMING_ATTACK_DELAY_MS: 100,

	/**
	 * Maximale Anzahl von IPs die für Fehlversuche gespeichert werden
	 */
	MAX_FAILED_IPS: 100,

	/**
	 * Passwort-Anforderungen
	 */
	PASSWORD: {
		MIN_LENGTH: 8,
		REQUIRE_UPPERCASE: true,
		REQUIRE_LOWERCASE: true,
		REQUIRE_NUMBERS: true,
		REQUIRE_SPECIAL_CHARS: true,
	},

	/**
	 * Username-Anforderungen
	 */
	USERNAME: {
		MIN_LENGTH: 3,
		MAX_LENGTH: 50,
		PATTERN: /^[a-zA-Z0-9_]{3,50}$/,
	},

	/**
	 * Verzögerungsfunktion für Timing-Attack-Schutz
	 * Zentrale Utility-Funktion um DRY zu gewährleisten
	 */
	delay: (ms?: number): Promise<void> => {
		const delayMs = ms ?? SecurityConstants.TIMING_ATTACK_DELAY_MS;
		return new Promise((resolve) => setTimeout(resolve, delayMs));
	},
} as const;

/**
 * Extrahiert die Client-IP-Adresse aus einem Express-Request
 * Unterstützt X-Forwarded-For Header für Reverse Proxies
 * @param req Express Request-Objekt
 * @returns Client-IP-Adresse oder "unknown"
 */
export function getClientIP(req: {
	headers?: { [key: string]: string | string[] | undefined };
	ip?: string;
	socket?: { remoteAddress?: string };
}): string {
	// Prüfe X-Forwarded-For Header (Reverse Proxy)
	const forwardedFor = req.headers?.["x-forwarded-for"];
	if (forwardedFor) {
		// Kann mehrere IPs enthalten, erste ist die Client-IP
		const ips = Array.isArray(forwardedFor)
			? forwardedFor[0]
			: forwardedFor.split(",")[0];
		return ips?.trim() || "unknown";
	}

	// Fallback auf req.ip oder socket.remoteAddress
	return req.ip || req.socket?.remoteAddress || "unknown";
}

export type SecurityConstantsType = typeof SecurityConstants;
