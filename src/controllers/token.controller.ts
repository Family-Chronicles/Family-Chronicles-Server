import { Router } from "express";
import { AppContext } from "../core/context.core.js";
import { handle, notFound, parse } from "../core/http.core.js";
import { ApiToken } from "../models/federation.model.js";
import { apiTokenSchema } from "../validation/schemas.js";

/** Never send the hash */
const toPublicToken = ({ TokenHash, ...rest }: ApiToken) => rest;

/** API tokens for machine access, e.g. other instances (Admin) */
export function tokenController(ctx: AppContext): Router {
	const router = Router();
	const { apiTokens, users } = ctx.repos;
	router.use(ctx.auth.require("Admin"));

	/**
	 * GET /api/v1/tokens
	 * @tags federation
	 * @summary All API tokens, without the secret (Admin)
	 * @security BearerAuth
	 * @return {array<object>} 200 - tokens
	 */
	router.get(
		"/",
		handle(async (req, res) => {
			const tokens = await apiTokens.findAll();
			tokens.sort((a, b) => b.CreatedAt.localeCompare(a.CreatedAt));
			res.send(tokens.map(toPublicToken));
		})
	);

	/**
	 * POST /api/v1/tokens
	 * @tags federation
	 * @summary Create an API token for a user (Admin). The token is only shown in this response.
	 * @security BearerAuth
	 * @param {object} request.body.required - { UserId, Name, ExpiresInDays }
	 * @return {object} 201 - { Token, ...entry }
	 */
	router.post(
		"/",
		handle(async (req, res) => {
			const body = parse(apiTokenSchema, req.body);
			const user = await users.findById(body.UserId);
			if (!user) throw notFound("User");
			const { token, entry } = await ctx.auth.createApiToken(
				user,
				body.Name,
				body.ExpiresInDays
			);
			res.status(201).send({ ...toPublicToken(entry), Token: token });
		})
	);

	/**
	 * DELETE /api/v1/tokens/{id}
	 * @tags federation
	 * @summary Revoke an API token (Admin)
	 * @security BearerAuth
	 * @param {string} id.path.required - token id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		handle(async (req, res) => {
			if (!(await apiTokens.delete(req.params.id)))
				throw notFound("Token");
			res.send({ success: true });
		})
	);

	return router;
}
