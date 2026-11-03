import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { Family, FamilyMembership } from "../models/family.model.js";
import { GenealogyService } from "../services/genealogy.srvs.js";
import { familySchema, membershipSchema } from "../validation/schemas.js";

export function familyController(
	ctx: AppContext,
	genealogy: GenealogyService
): Router {
	const router = Router();
	const { families, memberships, persons } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");

	const load = async (id: string) => {
		const family = await families.findById(id);
		if (!family) throw notFound("Family");
		return family;
	};

	/**
	 * GET /api/v1/families
	 * @tags families
	 * @summary All families, with member count
	 * @security BearerAuth
	 * @return {array<object>} 200 - families
	 */
	router.get(
		"/",
		read,
		handle(async (req, res) => {
			const [all, links] = await Promise.all([
				families.findAll(),
				memberships.findAll(),
			]);
			res.send(
				all
					.map((f) => ({
						...f,
						MemberCount: links.filter((l) => l.FamilyId === f.Id)
							.length,
					}))
					.sort((a, b) => a.Name.localeCompare(b.Name))
			);
		})
	);

	/**
	 * GET /api/v1/families/{id}
	 * @tags families
	 * @summary One family including its surnames
	 * @security BearerAuth
	 * @param {string} id.path.required - family id
	 * @return {object} 200 - family
	 */
	router.get(
		"/:id",
		read,
		handle(async (req, res) => {
			const family = await load(req.params.id);
			res.send({
				...family,
				Surnames: await genealogy.familySurnames(family.Id),
			});
		})
	);

	/**
	 * GET /api/v1/families/{id}/members
	 * @tags families
	 * @summary Memberships of a family, including the person
	 * @security BearerAuth
	 * @param {string} id.path.required - family id
	 * @return {array<object>} 200 - memberships with Person
	 */
	router.get(
		"/:id/members",
		read,
		handle(async (req, res) => {
			const family = await load(req.params.id);
			const links = await memberships.findAll({ FamilyId: family.Id });
			const members = await persons.findByIds(
				links.map((l) => l.PersonId)
			);
			res.send(
				links.map((l) => ({
					...l,
					Person: members.find((p) => p.Id === l.PersonId) ?? null,
				}))
			);
		})
	);

	/**
	 * POST /api/v1/families
	 * @tags families
	 * @summary Create a family (Editor)
	 * @security BearerAuth
	 * @param {object} request.body.required - { Name, Description, Notes, HistoricalNames }
	 * @return {object} 201 - family
	 */
	router.post(
		"/",
		write,
		handle(async (req, res) => {
			const body = parse(familySchema, req.body);
			const family: Family = {
				Id: crypto.randomUUID(),
				...body,
				CreatedAt: now(),
				UpdatedAt: now(),
			};
			await families.create(family);
			res.status(201).send(family);
		})
	);

	/**
	 * PUT /api/v1/families/{id}
	 * @tags families
	 * @summary Update a family (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - family id
	 * @return {object} 200 - family
	 */
	router.put(
		"/:id",
		write,
		handle(async (req, res) => {
			const family = await load(req.params.id);
			const patch = parse(familySchema.partial(), req.body);
			res.send(
				await families.update(family.Id, { ...patch, UpdatedAt: now() })
			);
		})
	);

	/**
	 * DELETE /api/v1/families/{id}
	 * @tags families
	 * @summary Delete a family and its memberships (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - family id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		write,
		handle(async (req, res) => {
			if (!(await genealogy.deleteFamily(req.params.id))) {
				throw notFound("Family");
			}
			res.send({ success: true });
		})
	);

	return router;
}

/** Links between persons and families */
export function membershipController(ctx: AppContext): Router {
	const router = Router();
	const { families, memberships, persons } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");

	/**
	 * GET /api/v1/memberships
	 * @tags memberships
	 * @summary Memberships, filterable by family or person
	 * @security BearerAuth
	 * @param {string} familyId.query - family id
	 * @param {string} personId.query - person id
	 * @return {array<object>} 200 - memberships
	 */
	router.get(
		"/",
		read,
		handle(async (req, res) => {
			const filter: Partial<FamilyMembership> = {};
			if (typeof req.query.familyId === "string")
				filter.FamilyId = req.query.familyId;
			if (typeof req.query.personId === "string")
				filter.PersonId = req.query.personId;
			res.send(await memberships.findAll(filter));
		})
	);

	/**
	 * POST /api/v1/memberships
	 * @tags memberships
	 * @summary Add a person to a family (Editor)
	 * @security BearerAuth
	 * @param {object} request.body.required - { FamilyId, PersonId, Role, StartDate, EndDate, Notes }
	 * @return {object} 201 - membership
	 */
	router.post(
		"/",
		write,
		handle(async (req, res) => {
			const body = parse(membershipSchema, req.body);
			if (!(await families.findById(body.FamilyId)))
				throw notFound("Family");
			if (!(await persons.findById(body.PersonId)))
				throw notFound("Person");
			if (
				await memberships.findOne({
					FamilyId: body.FamilyId,
					PersonId: body.PersonId,
				})
			) {
				throw new HttpError(
					409,
					"Person is already a member of this family"
				);
			}
			const membership: FamilyMembership = {
				Id: crypto.randomUUID(),
				...body,
			};
			await memberships.create(membership);
			res.status(201).send(membership);
		})
	);

	/**
	 * PUT /api/v1/memberships/{id}
	 * @tags memberships
	 * @summary Update role, dates or notes of a membership (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - membership id
	 * @return {object} 200 - membership
	 */
	router.put(
		"/:id",
		write,
		handle(async (req, res) => {
			const patch = parse(
				membershipSchema
					.omit({ FamilyId: true, PersonId: true })
					.partial(),
				req.body
			);
			const updated = await memberships.update(req.params.id, patch);
			if (!updated) throw notFound("Membership");
			res.send(updated);
		})
	);

	/**
	 * DELETE /api/v1/memberships/{id}
	 * @tags memberships
	 * @summary Remove a person from a family (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - membership id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		write,
		handle(async (req, res) => {
			if (!(await memberships.delete(req.params.id))) {
				throw notFound("Membership");
			}
			res.send({ success: true });
		})
	);

	return router;
}
