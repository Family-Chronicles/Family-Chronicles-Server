import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { Role, User } from "../models/user.model.js";
import { IRepository } from "../repositories/repository.interface.js";
import { HttpError } from "../core/http.core.js";

const scrypt = promisify(crypto.scrypt) as (
	password: string,
	salt: string,
	keylen: number
) => Promise<Buffer>;

const ROLE_LEVEL: Record<Role, number> = { Viewer: 1, Editor: 2, Admin: 3 };

/** The authenticated user attached to a request */
export interface AuthUser {
	Id: string;
	Role: Role;
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
	constructor(
		private readonly users: IRepository<User>,
		private readonly secret: string,
		private readonly lifetime: string
	) {}

	public issueToken(user: User): string {
		return jwt.sign({ role: user.Role }, this.secret, {
			subject: user.Id,
			expiresIn: this.lifetime as jwt.SignOptions["expiresIn"],
		});
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
		let subject: string;
		try {
			const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
			subject = payload.sub as string;
		} catch {
			throw new HttpError(401, "Invalid or expired token");
		}
		// load the user so deleted users and role changes take effect immediately
		const user = await this.users.findById(subject);
		if (!user) throw new HttpError(401, "User no longer exists");
		return { Id: user.Id, Role: user.Role };
	}
}
