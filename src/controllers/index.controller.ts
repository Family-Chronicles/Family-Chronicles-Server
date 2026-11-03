import { Router } from "express";
import { AppContext } from "../core/context.core.js";

export function indexController(ctx: AppContext): Router {
	const router = Router();

	/**
	 * GET /api/v1
	 * @tags meta
	 * @summary Base data of the API
	 * @return {object} 200 - name and version
	 */
	router.get("/", (req, res) => {
		res.send({
			name: ctx.config.meta.name,
			version: ctx.config.meta.version,
			instance: ctx.config.server.instanceName,
		});
	});

	/**
	 * GET /api/v1/health
	 * @tags meta
	 * @summary Health check
	 * @return {object} 200 - ok
	 */
	router.get("/health", (req, res) => {
		res.send({ status: "ok" });
	});

	return router;
}
