import { Router } from "express";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { toPublicUser } from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../services/auth.srvs.js";
import {
	loginSchema,
	passwordChangeSchema,
	refreshSchema,
	resetConfirmSchema,
	resetRequestSchema,
} from "../validation/schemas.js";

export function authController(ctx: AppContext): Router {
	const router = Router();
	const { users } = ctx.repos;

	/**
	 * POST /api/v1/auth/login
	 * @tags auth
	 * @summary Login with email and password. Returns a short-lived access token and a refresh token.
	 * @param {object} request.body.required - { "Email": "string", "Password": "string" }
	 * @return {object} 200 - { token, refreshToken, user }
	 * @return {object} 401 - invalid credentials
	 */
	router.post(
		"/login",
		handle(async (req, res) => {
			const { Email, Password } = parse(loginSchema, req.body);
			const user = await ctx.auth.login(Email, Password);
			res.send({
				token: ctx.auth.issueToken(user),
				refreshToken: await ctx.auth.createSession(user),
				user: toPublicUser(user),
			});
		})
	);

	/**
	 * GET /api/v1/auth/me
	 * @tags auth
	 * @summary The logged in user
	 * @security BearerAuth
	 * @return {object} 200 - user
	 */
	router.get(
		"/me",
		ctx.auth.require("Viewer"),
		handle(async (req, res) => {
			const user = await users.findById(req.user!.Id);
			if (!user) throw notFound("User");
			res.send(toPublicUser(user));
		})
	);

	/**
	 * PUT /api/v1/auth/me/password
	 * @tags auth
	 * @summary Change the own password
	 * @security BearerAuth
	 * @param {object} request.body.required - { "CurrentPassword": "string", "NewPassword": "string" }
	 * @return {object} 200 - success
	 */
	router.put(
		"/me/password",
		ctx.auth.require("Viewer"),
		handle(async (req, res) => {
			const body = parse(passwordChangeSchema, req.body);
			const user = await users.findById(req.user!.Id);
			if (!user) throw notFound("User");
			if (
				!(await verifyPassword(body.CurrentPassword, user.PasswordHash))
			) {
				throw new HttpError(400, "Current password is wrong");
			}
			await users.update(user.Id, {
				PasswordHash: await hashPassword(body.NewPassword),
				UpdatedAt: now(),
			});
			// log out all other devices
			await ctx.auth.revokeAll(user.Id, body.RefreshToken);
			res.send({ success: true });
		})
	);

	/**
	 * GET /api/v1/auth/config
	 * @tags auth
	 * @summary Which login features are available
	 * @return {object} 200 - { passwordReset }
	 */
	router.get("/config", (req, res) => {
		res.send({ passwordReset: !!ctx.mailer });
	});

	/**
	 * POST /api/v1/auth/refresh
	 * @tags auth
	 * @summary New access token for a refresh token. The refresh token is replaced (use the new one).
	 * @param {object} request.body.required - { "RefreshToken": "string" }
	 * @return {object} 200 - { token, refreshToken, user }
	 * @return {object} 401 - invalid or expired refresh token
	 */
	router.post(
		"/refresh",
		handle(async (req, res) => {
			const { RefreshToken } = parse(refreshSchema, req.body);
			const { user, refreshToken } = await ctx.auth.refresh(RefreshToken);
			res.send({
				token: ctx.auth.issueToken(user),
				refreshToken,
				user: toPublicUser(user),
			});
		})
	);

	/**
	 * POST /api/v1/auth/logout
	 * @tags auth
	 * @summary Ends the session of a refresh token
	 * @param {object} request.body.required - { "RefreshToken": "string" }
	 * @return {object} 200 - success
	 */
	router.post(
		"/logout",
		handle(async (req, res) => {
			const { RefreshToken } = parse(refreshSchema, req.body);
			await ctx.auth.revoke(RefreshToken);
			res.send({ success: true });
		})
	);

	/**
	 * POST /api/v1/auth/password-reset
	 * @tags auth
	 * @summary Sends a password reset link by email. Always answers 202, whether the address is known or not.
	 * @param {object} request.body.required - { "Email": "string" }
	 * @return {object} 202 - accepted
	 * @return {object} 503 - no mail server configured
	 */
	router.post(
		"/password-reset",
		handle(async (req, res) => {
			if (!ctx.mailer)
				throw new HttpError(503, "Password reset is not configured");
			const { Email } = parse(resetRequestSchema, req.body);
			const user = await users.findOne({ Email: Email.toLowerCase() });
			if (user && !(await ctx.auth.recentlyRequestedReset(user.Id))) {
				const token = await ctx.auth.createPasswordReset(user);
				const link = `${
					ctx.config.mail.appUrl
				}/#/reset-password?token=${encodeURIComponent(token)}`;
				await ctx.mailer.send({
					to: user.Email,
					subject:
						"Family Chronicles – Passwort zurücksetzen / Reset password",
					text: [
						`Hallo ${user.Name},`,
						"",
						"über den folgenden Link kannst du ein neues Passwort festlegen. Er ist eine Stunde gültig.",
						"Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
						"",
						"Use the following link to set a new password. It is valid for one hour.",
						"If you did not ask for this, you can ignore this email.",
						"",
						link,
					].join("\n"),
				});
			}
			res.status(202).send({ success: true });
		})
	);

	/**
	 * POST /api/v1/auth/password-reset/confirm
	 * @tags auth
	 * @summary Sets a new password with the token from the reset email. Ends all sessions of the user.
	 * @param {object} request.body.required - { "Token": "string", "NewPassword": "string" }
	 * @return {object} 200 - success
	 * @return {object} 400 - invalid or expired link
	 */
	router.post(
		"/password-reset/confirm",
		handle(async (req, res) => {
			const { Token, NewPassword } = parse(resetConfirmSchema, req.body);
			const user = await ctx.auth.consumePasswordReset(Token);
			await users.update(user.Id, {
				PasswordHash: await hashPassword(NewPassword),
				UpdatedAt: now(),
			});
			await ctx.auth.revokeAll(user.Id);
			res.send({ success: true });
		})
	);

	return router;
}
