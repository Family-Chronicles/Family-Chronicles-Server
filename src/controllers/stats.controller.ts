import { Router } from "express";
import { AppContext } from "../core/context.core.js";
import { handle } from "../core/http.core.js";

/** Key figures for the dashboard, so clients do not need to load all persons */
export function statsController(ctx: AppContext): Router {
	const router = Router();
	const { persons, families } = ctx.repos;

	/**
	 * GET /api/v1/stats
	 * @tags meta
	 * @summary Counts, recently edited persons and birthdays of the current month
	 * @security BearerAuth
	 * @param {number} month.query - month for birthdays (1-12), default: current month
	 * @return {object} 200 - { Persons, Families, Living, Recent, Birthdays }
	 */
	router.get(
		"/",
		ctx.auth.require("Viewer"),
		handle(async (req, res) => {
			const requested = Number(req.query.month);
			const month =
				requested >= 1 && requested <= 12
					? requested
					: new Date().getMonth() + 1;
			const mm = String(month).padStart(2, "0");

			const [all, living, recent, birthdays, familyCount] =
				await Promise.all([
					persons.query({ limit: 1 }),
					persons.query({
						limit: 1,
						notNull: [{ field: "DateOfDeath", value: false }],
					}),
					persons.query({
						limit: 6,
						sort: [{ field: "UpdatedAt", direction: -1 }],
					}),
					persons.query({
						limit: 100,
						match: [
							{
								field: "DateOfBirth",
								pattern: new RegExp(`^\\d{4}-${mm}-\\d{2}$`),
							},
						],
						sort: [{ field: "DateOfBirth", direction: 1 }],
					}),
					families.count(),
				]);

			res.send({
				Persons: all.total,
				Families: familyCount,
				Living: living.total,
				Recent: recent.items,
				// sorted by day of month
				Birthdays: birthdays.items.sort((a, b) =>
					a
						.DateOfBirth!.slice(8)
						.localeCompare(b.DateOfBirth!.slice(8))
				),
			});
		})
	);

	return router;
}
