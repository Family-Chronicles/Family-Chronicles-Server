import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { toPublicUser, User } from "../models/user.model.js";
import { hashPassword } from "../services/auth.srvs.js";
import { userCreateSchema, userUpdateSchema } from "../validation/schemas.js";

/** User management – admins only */
export function userController(ctx: AppContext): Router {
	const router = Router();
	const { users } = ctx.repos;
	router.use(ctx.auth.require("Admin"));

	const ensureEmailFree = async (email: string, exceptId?: string) => {
		const existing = await users.findOne({ Email: email });
		if (existing && existing.Id !== exceptId) {
			throw new HttpError(409, "Email already in use");
		}
	};

	const ensureAnotherAdmin = async (id: string) => {
		const admins = await users.findAll({ Role: "Admin" });
		if (admins.every((a) => a.Id === id)) {
			throw new HttpError(409, "The last admin cannot be removed");
		}
	};

	/**
	 * GET /api/v1/users
	 * @tags users
	 * @summary All users (Admin)
	 * @security BearerAuth
	 * @return {array<object>} 200 - users
	 */
	router.get(
		"/",
		handle(async (req, res) => {
			res.send((await users.findAll()).map(toPublicUser));
		})
	);

	/**
	 * GET /api/v1/users/{id}
	 * @tags users
	 * @summary One user (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - user id
	 * @return {object} 200 - user
	 */
	router.get(
		"/:id",
		handle(async (req, res) => {
			const user = await users.findById(req.params.id);
			if (!user) throw notFound("User");
			res.send(toPublicUser(user));
		})
	);

	/**
	 * POST /api/v1/users
	 * @tags users
	 * @summary Create a user (Admin)
	 * @security BearerAuth
	 * @param {object} request.body.required - { Name, Email, Password, Role }
	 * @return {object} 201 - user
	 */
	router.post(
		"/",
		handle(async (req, res) => {
			const body = parse(userCreateSchema, req.body);
			await ensureEmailFree(body.Email);
			const user: User = {
				Id: crypto.randomUUID(),
				Name: body.Name,
				Email: body.Email,
				PasswordHash: await hashPassword(body.Password),
				Role: body.Role,
				CreatedAt: now(),
				UpdatedAt: now(),
			};
			await users.create(user);
			res.status(201).send(toPublicUser(user));
		})
	);

	/**
	 * PUT /api/v1/users/{id}
	 * @tags users
	 * @summary Update a user (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - user id
	 * @return {object} 200 - user
	 */
	router.put(
		"/:id",
		handle(async (req, res) => {
			const body = parse(userUpdateSchema, req.body);
			const user = await users.findById(req.params.id);
			if (!user) throw notFound("User");
			if (body.Email) await ensureEmailFree(body.Email, user.Id);
			if (body.Role && body.Role !== "Admin" && user.Role === "Admin") {
				await ensureAnotherAdmin(user.Id);
			}
			const patch: Partial<User> = { UpdatedAt: now() };
			if (body.Name) patch.Name = body.Name;
			if (body.Email) patch.Email = body.Email;
			if (body.Role) patch.Role = body.Role;
			if (body.Password)
				patch.PasswordHash = await hashPassword(body.Password);
			const updated = await users.update(user.Id, patch);
			res.send(toPublicUser(updated!));
		})
	);

	/**
	 * DELETE /api/v1/users/{id}
	 * @tags users
	 * @summary Delete a user (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - user id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		handle(async (req, res) => {
			const user = await users.findById(req.params.id);
			if (!user) throw notFound("User");
			if (user.Id === req.user!.Id) {
				throw new HttpError(409, "You cannot delete yourself");
			}
			if (user.Role === "Admin") await ensureAnotherAdmin(user.Id);
			await users.delete(user.Id);
			await ctx.auth.revokeAll(user.Id);
			await ctx.repos.apiTokens.deleteMany({ UserId: user.Id });
			res.send({ success: true });
		})
	);

	return router;
}
