import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { Role, User } from "../models/user.model.js";
import { IRepository } from "../repositories/repository.interface.js";
import { HttpError } from "../core/http.core.js";
import { Repositories } from "./database.srvs.js";
import { Config } from "../types/config.type.js";
import { PasswordReset, Session } from "../models/session.model.js";
import { ApiToken } from "../models/federation.model.js";

const scrypt = promisify(crypto.scrypt) as (
	password: string,
	salt: string,
	keylen: number
) => Promise<Buffer>;

/** API tokens look like "fc_<id>.<secret>" */
export const API_TOKEN_PREFIX = "fc_";
const RESET_LIFETIME_MS = 60 * 60 * 1000;
const randomToken = () => crypto.randomBytes(32).toString("base64url");
const sha256 = (s: string) =>
	crypto.createHash("sha256").update(s).digest("hex");

const ROLE_LEVEL: Record<Role, number> = { Viewer: 1, Editor: 2, Admin: 3 };

/** The authenticated user attached to a request */
export interface AuthUser {
	Id: string;
	Role: Role;
	/** True when the request was authenticated with an API token (another instance) */
	ViaApiToken?: boolean;
}

declare module "express-serve-static-core" {
	interface Request {
		user?: AuthUser;
	}
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = await scrypt(password, salt, 64);
	return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(
	password: string,
	stored: string
): Promise<boolean> {
	const [algorithm, salt, hash] = stored.split("$");
	if (algorithm !== "scrypt" || !salt || !hash) return false;
	const expected = Buffer.from(hash, "hex");
	const actual = await scrypt(password, salt, expected.length);
	return crypto.timingSafeEqual(expected, actual);
}

export function hasRole(user: AuthUser | undefined, required: Role): boolean {
	return !!user && ROLE_LEVEL[user.Role] >= ROLE_LEVEL[required];
}

/**
 * Issues and checks JWT access tokens.
 */
export class AuthService {
	private readonly users: IRepository<User>;
	private readonly secret: string;

	constructor(
		private readonly repos: Pick<
			Repositories,
			"users" | "sessions" | "passwordResets" | "apiTokens"
		>,
		private readonly options: Config["auth"]
	) {
		this.users = repos.users;
		this.secret = options.jwtSecret;
	}

	/** Short-lived access token (JWT) */
	public issueToken(user: User): string {
		return jwt.sign({ role: user.Role }, this.secret, {
			subject: user.Id,
			expiresIn: this.options
				.tokenLifetime as jwt.SignOptions["expiresIn"],
		});
	}

	/** Creates a long-lived API token for a user; the plain token is only returned here */
	public async createApiToken(
		user: User,
		name: string,
		expiresInDays: number | null
	): Promise<{ token: string; entry: ApiToken }> {
		const secret = randomToken();
		const entry: ApiToken = {
			Id: crypto.randomUUID(),
			UserId: user.Id,
			Name: name,
			TokenHash: sha256(secret),
			CreatedAt: new Date().toISOString(),
			LastUsedAt: null,
			ExpiresAt: expiresInDays
				? new Date(
						Date.now() + expiresInDays * 86_400_000
				  ).toISOString()
				: null,
		};
		await this.repos.apiTokens.create(entry);
		return { token: `${API_TOKEN_PREFIX}${entry.Id}.${secret}`, entry };
	}

	private async verifyApiToken(
		token: string
	): Promise<AuthUser & { ExpiresAt: number }> {
		const entry = await this.findByToken(
			this.repos.apiTokens as IRepository<
				ApiToken & { ExpiresAt: string }
			>,
			token.slice(API_TOKEN_PREFIX.length),
			true
		);
		if (!entry) throw new HttpError(401, "Invalid or expired token");
		const user = await this.users.findById(entry.UserId);
		if (!user) throw new HttpError(401, "User no longer exists");
		// remember the last use, at most once per minute
		if (
			!entry.LastUsedAt ||
			Date.now() - Date.parse(entry.LastUsedAt) > 60_000
		) {
			await this.repos.apiTokens.update(entry.Id, {
				LastUsedAt: new Date().toISOString(),
			});
		}
		return {
			Id: user.Id,
			Role: user.Role,
			ViaApiToken: true,
			ExpiresAt: entry.ExpiresAt
				? Date.parse(entry.ExpiresAt)
				: Number.MAX_SAFE_INTEGER,
		};
	}

	/** Starts a session and returns its refresh token ("<id>.<secret>", only the hash is stored) */
	public async createSession(user: User): Promise<string> {
		const secret = randomToken();
		const session: Session = {
			Id: crypto.randomUUID(),
			UserId: user.Id,
			TokenHash: sha256(secret),
			ExpiresAt: this.refreshExpiry(),
			CreatedAt: new Date().toISOString(),
			LastUsedAt: new Date().toISOString(),
		};
		await this.repos.sessions.create(session);
		return `${session.Id}.${secret}`;
	}

	/** Checks a refresh token, replaces it with a new one (rotation) and returns the user */
	public async refresh(
		refreshToken: string
	): Promise<{ user: User; refreshToken: string }> {
		const session = await this.findByToken(
			this.repos.sessions,
			refreshToken
		);
		if (!session)
			throw new HttpError(401, "Invalid or expired refresh token");
		const user = await this.users.findById(session.UserId);
		if (!user) {
			await this.repos.sessions.delete(session.Id);
			throw new HttpError(401, "User no longer exists");
		}
		const secret = randomToken();
		await this.repos.sessions.update(session.Id, {
			TokenHash: sha256(secret),
			ExpiresAt: this.refreshExpiry(),
			LastUsedAt: new Date().toISOString(),
		});
		return { user, refreshToken: `${session.Id}.${secret}` };
	}

	/** Ends the session of a refresh token (logout) */
	public async revoke(refreshToken: string): Promise<void> {
		const session = await this.findByToken(
			this.repos.sessions,
			refreshToken
		);
		if (session) await this.repos.sessions.delete(session.Id);
	}

	/** Ends all sessions of a user, e.g. after a password change */
	public async revokeAll(
		userId: string,
		exceptRefreshToken?: string
	): Promise<void> {
		const keep = exceptRefreshToken
			? exceptRefreshToken.split(".")[0]
			: null;
		for (const session of await this.repos.sessions.findAll({
			UserId: userId,
		})) {
			if (session.Id !== keep)
				await this.repos.sessions.delete(session.Id);
		}
	}

	/** Creates a one-time password reset token (valid for one hour) */
	public async createPasswordReset(user: User): Promise<string> {
		await this.repos.passwordResets.deleteMany({ UserId: user.Id });
		const secret = randomToken();
		const reset: PasswordReset = {
			Id: crypto.randomUUID(),
			UserId: user.Id,
			TokenHash: sha256(secret),
			ExpiresAt: new Date(Date.now() + RESET_LIFETIME_MS).toISOString(),
			CreatedAt: new Date().toISOString(),
		};
		await this.repos.passwordResets.create(reset);
		return `${reset.Id}.${secret}`;
	}

	/** True when a reset for this user was requested within the last minute */
	public async recentlyRequestedReset(userId: string): Promise<boolean> {
		const resets = await this.repos.passwordResets.findAll({
			UserId: userId,
		});
		return resets.some(
			(r) => Date.now() - Date.parse(r.CreatedAt) < 60_000
		);
	}

	/** Uses up a reset token and returns its user */
	public async consumePasswordReset(token: string): Promise<User> {
		const reset = await this.findByToken(this.repos.passwordResets, token);
		if (!reset)
			throw new HttpError(400, "The link is invalid or has expired");
		await this.repos.passwordResets.delete(reset.Id);
		const user = await this.users.findById(reset.UserId);
		if (!user)
			throw new HttpError(400, "The link is invalid or has expired");
		return user;
	}

	private refreshExpiry(): string {
		return new Date(
			Date.now() + this.options.refreshTokenDays * 86_400_000
		).toISOString();
	}

	private async findByToken<
		T extends { Id: string; TokenHash: string; ExpiresAt: string | null }
	>(
		repo: IRepository<T>,
		token: string,
		keepExpired = false
	): Promise<T | null> {
		const [id, secret] = String(token ?? "").split(".");
		if (!id || !secret) return null;
		const entry = await repo.findById(id);
		if (!entry) return null;
		const expected = Buffer.from(entry.TokenHash, "hex");
		const actual = Buffer.from(sha256(secret), "hex");
		if (
			expected.length !== actual.length ||
			!crypto.timingSafeEqual(expected, actual)
		)
			return null;
		if (entry.ExpiresAt && Date.parse(entry.ExpiresAt) < Date.now()) {
			if (!keepExpired) await repo.delete(entry.Id);
			return null;
		}
		return entry;
	}

	public async login(email: string, password: string): Promise<User> {
		const user = await this.users.findOne({
			Email: email.trim().toLowerCase(),
		});
		// verify even if the user is missing, so timing does not leak existence
		const ok = await verifyPassword(
			password,
			user?.PasswordHash ?? "scrypt$00$00"
		);
		if (!user || !ok) throw new HttpError(401, "Invalid email or password");
		return user;
	}

	/** Middleware: requires a valid token and at least the given role */
	public require(role: Role = "Viewer") {
		return (req: Request, res: Response, next: NextFunction) => {
			this.authenticate(req)
				.then((user) => {
					if (!hasRole(user, role)) {
						throw new HttpError(403, `Requires role ${role}`);
					}
					req.user = user;
					next();
				})
				.catch(next);
		};
	}

	private async authenticate(req: Request): Promise<AuthUser> {
		const header = req.headers.authorization ?? "";
		const [scheme, token] = header.split(" ");
		if (scheme !== "Bearer" || !token) {
			throw new HttpError(401, "No token provided");
		}
		return this.verify(token);
	}

	/** Checks a token and returns the user plus the token expiry (ms since epoch) */
	public async verify(
		token: string
	): Promise<AuthUser & { ExpiresAt: number }> {
		if (token.startsWith(API_TOKEN_PREFIX))
			return this.verifyApiToken(token);
		let subject: string;
		let expiresAt: number;
		try {
			const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
			subject = payload.sub as string;
			expiresAt = (payload.exp ?? 0) * 1000;
		} catch {
			throw new HttpError(401, "Invalid or expired token");
		}
		// load the user so deleted users and role changes take effect immediately
		const user = await this.users.findById(subject);
		if (!user) throw new HttpError(401, "User no longer exists");
		return { Id: user.Id, Role: user.Role, ExpiresAt: expiresAt };
	}
}
