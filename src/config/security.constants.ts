/**
 * Security-related constants.
 * Central configuration for authentication and authorization.
 */
export const SecurityConstants = {
	/**
	 * Maximum number of failed login attempts before a temporary lock.
	 */
	MAX_LOGIN_ATTEMPTS: 5,

	/**
	 * Duration of the temporary lock in milliseconds (15 minutes).
	 */
	LOCKOUT_DURATION_MS: 15 * 60 * 1000,

	/**
	 * Threshold for a permanent account lock (factor of MAX_LOGIN_ATTEMPTS).
	 */
	PERMANENT_LOCK_MULTIPLIER: 3,

	/**
	 * Session timeout in milliseconds (default: 24 hours, overridable via config).
	 */
	SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,

	/**
	 * Delay for timing-attack protection in milliseconds.
	 */
	TIMING_ATTACK_DELAY_MS: 100,

	/**
	 * Maximum number of IPs stored per failed-attempt record.
	 */
	MAX_FAILED_IPS: 100,

	/**
	 * Password requirements.
	 */
	PASSWORD: {
		MIN_LENGTH: 8,
		REQUIRE_UPPERCASE: true,
		REQUIRE_LOWERCASE: true,
		REQUIRE_NUMBERS: true,
		REQUIRE_SPECIAL_CHARS: true,
	},

	/**
	 * Username requirements.
	 */
	USERNAME: {
		MIN_LENGTH: 3,
		MAX_LENGTH: 50,
		PATTERN: /^[a-zA-Z0-9_]{3,50}$/,
	},

	/**
	 * Delay helper for timing-attack protection.
	 * Central utility function to keep things DRY.
	 */
	delay: (ms?: number): Promise<void> => {
		const delayMs = ms ?? SecurityConstants.TIMING_ATTACK_DELAY_MS;
		return new Promise((resolve) => setTimeout(resolve, delayMs));
	},
} as const;

/**
 * Extracts the client IP address from an Express request.
 * Supports the X-Forwarded-For header for reverse proxies.
 * @param req Express request object
 * @returns Client IP address, or "unknown"
 */
export function getClientIP(req: {
	headers?: { [key: string]: string | string[] | undefined };
	ip?: string;
	socket?: { remoteAddress?: string };
}): string {
	// Check the X-Forwarded-For header (reverse proxy)
	const forwardedFor = req.headers?.["x-forwarded-for"];
	if (forwardedFor) {
		// May contain multiple IPs; the first one is the client IP
		const ips = Array.isArray(forwardedFor)
			? forwardedFor[0]
			: forwardedFor.split(",")[0];
		return ips?.trim() || "unknown";
	}

	// Fall back to req.ip or socket.remoteAddress
	return req.ip || req.socket?.remoteAddress || "unknown";
}

export type SecurityConstantsType = typeof SecurityConstants;
