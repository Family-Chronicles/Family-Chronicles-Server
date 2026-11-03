import { Router } from "express";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { toPublicUser } from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../services/auth.srvs.js";
import { loginSchema, passwordChangeSchema } from "../validation/schemas.js";

export function authController(ctx: AppContext): Router {
	const router = Router();
	const { users } = ctx.repos;

	/**
	 * POST /api/v1/auth/login
	 * @tags auth
	 * @summary Login with email and password, returns a bearer token
	 * @param {object} request.body.required - { "Email": "string", "Password": "string" }
	 * @return {object} 200 - { token, user }
	 * @return {object} 401 - invalid credentials
	 */
	router.post(
		"/login",
		handle(async (req, res) => {
			const { Email, Password } = parse(loginSchema, req.body);
			const user = await ctx.auth.login(Email, Password);
			res.send({
				token: ctx.auth.issueToken(user),
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
			res.send({ success: true });
		})
	);

	return router;
}
