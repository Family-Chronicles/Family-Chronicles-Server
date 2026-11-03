import crypto from "crypto";
import { HttpError } from "../core/http.core.js";
import { Peer, PeerStatus, RemotePerson } from "../models/federation.model.js";

const TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/**
 * Encrypts peer tokens at rest with a key derived from the JWT secret.
 */
export class TokenCipher {
	private key: Buffer;

	constructor(secret: string) {
		this.key = crypto
			.createHash("sha256")
			.update(`peer-token:${secret}`)
			.digest();
	}

	encrypt(plain: string): string {
		const iv = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
		const data = Buffer.concat([
			cipher.update(plain, "utf8"),
			cipher.final(),
		]);
		return [iv, cipher.getAuthTag(), data]
			.map((b) => b.toString("base64url"))
			.join(".");
	}

	decrypt(encrypted: string): string {
		const [iv, tag, data] = encrypted
			.split(".")
			.map((p) => Buffer.from(p, "base64url"));
		const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([
			decipher.update(data),
			decipher.final(),
		]).toString("utf8");
	}
}

/** Normalizes and checks a peer URL: http(s) only, no credentials, without trailing slash */
export function normalizePeerUrl(raw: string): string {
	let url: URL;
	try {
		url = new URL(raw.trim());
	} catch {
		throw new HttpError(400, "Invalid URL");
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") {
		throw new HttpError(400, "Only http and https URLs are allowed");
	}
	if (url.username || url.password)
		throw new HttpError(400, "URLs must not contain credentials");
	url.hash = "";
	url.search = "";
	let base = url.toString().replace(/\/+$/, "");
	if (!base.endsWith("/api/v1")) base += "/api/v1";
	return base;
}

const pickPerson = (p: Record<string, unknown>): RemotePerson => ({
	Id: String(p.Id ?? ""),
	FirstNames: Array.isArray(p.FirstNames) ? p.FirstNames.map(String) : [],
	MiddleNames: Array.isArray(p.MiddleNames) ? p.MiddleNames.map(String) : [],
	LastNames: Array.isArray(p.LastNames) ? p.LastNames.map(String) : [],
	BirthName: typeof p.BirthName === "string" ? p.BirthName : null,
	Gender: typeof p.Gender === "string" ? p.Gender : "Unknown",
	DateOfBirth: typeof p.DateOfBirth === "string" ? p.DateOfBirth : null,
	PlaceOfBirth: typeof p.PlaceOfBirth === "string" ? p.PlaceOfBirth : null,
	DateOfDeath: typeof p.DateOfDeath === "string" ? p.DateOfDeath : null,
	PlaceOfDeath: typeof p.PlaceOfDeath === "string" ? p.PlaceOfDeath : null,
});

export const remoteName = (p: RemotePerson) =>
	[...p.FirstNames, ...p.MiddleNames, ...p.LastNames].join(" ") || p.Id;

/**
 * Reads data from other instances. Only GET requests, with timeout, size limit
 * and without following redirects; responses are reduced to known fields.
 */
export class FederationClient {
	constructor(
		private readonly cipher: TokenCipher,
		private readonly fetcher: typeof fetch = fetch
	) {}

	private async get(
		baseUrl: string,
		token: string,
		path: string
	): Promise<unknown> {
		let response: Response;
		try {
			response = await this.fetcher(`${baseUrl}${path}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
				redirect: "error",
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
		} catch {
			throw new HttpError(502, "The other instance cannot be reached");
		}
		if (response.status === 401 || response.status === 403) {
			throw new HttpError(502, "The other instance rejected the token");
		}
		if (response.status === 404)
			throw new HttpError(404, "Not found on the other instance");
		if (!response.ok)
			throw new HttpError(
				502,
				`The other instance answered ${response.status}`
			);
		const text = await response.text();
		if (text.length > MAX_RESPONSE_BYTES)
			throw new HttpError(
				502,
				"Response of the other instance is too large"
			);
		try {
			return JSON.parse(text);
		} catch {
			throw new HttpError(
				502,
				"The other instance did not answer with JSON"
			);
		}
	}

	/** Checks URL and token; returns the status to store */
	async check(baseUrl: string, token: string): Promise<PeerStatus> {
		try {
			const info = (await this.get(baseUrl, token, "/")) as {
				name?: string;
			};
			if (!info?.name) return "Unreachable";
			await this.get(baseUrl, token, "/auth/me");
			return "Ok";
		} catch (error) {
			return error instanceof HttpError && /rejected/.test(error.message)
				? "Unauthorized"
				: "Unreachable";
		}
	}

	async searchPersons(
		peer: Peer,
		q: string,
		limit = 20
	): Promise<RemotePerson[]> {
		const params = new URLSearchParams({
			q,
			limit: String(Math.min(limit, 50)),
		});
		const data = await this.get(
			peer.BaseUrl,
			this.cipher.decrypt(peer.TokenEncrypted),
			`/persons?${params}`
		);
		if (!Array.isArray(data))
			throw new HttpError(502, "Unexpected answer of the other instance");
		return data.map((p) => pickPerson(p as Record<string, unknown>));
	}

	async getPerson(peer: Peer, remoteId: string): Promise<RemotePerson> {
		if (!/^[\w-]{1,100}$/.test(remoteId))
			throw new HttpError(400, "Invalid id");
		const data = await this.get(
			peer.BaseUrl,
			this.cipher.decrypt(peer.TokenEncrypted),
			`/persons/${remoteId}`
		);
		return pickPerson((data ?? {}) as Record<string, unknown>);
	}
}
