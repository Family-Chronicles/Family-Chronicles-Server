import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, parse } from "../core/http.core.js";
import { Relationship } from "../models/relationship.model.js";
import { relationshipSchema } from "../validation/schemas.js";

const SYMMETRIC = [
	"Spouse",
	"Partner",
	"Sibling",
	"Related",
	"Other",
	"Unknown",
];

/** "Child" is stored as "Parent" with swapped persons */
function canonical<
	T extends Pick<Relationship, "PersonId" | "RelatedPersonId" | "Type">
>(r: T): T {
	return r.Type === "Child"
		? {
				...r,
				Type: "Parent",
				PersonId: r.RelatedPersonId,
				RelatedPersonId: r.PersonId,
		  }
		: r;
}

export function relationshipController(ctx: AppContext): Router {
	const router = Router();
	const { relationships, persons } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");

	const validate = async (r: Relationship, exceptId?: string) => {
		if (r.PersonId === r.RelatedPersonId) {
			throw new HttpError(400, "A person cannot be related to itself");
		}
		const found = await persons.findByIds([r.PersonId, r.RelatedPersonId]);
		if (found.length !== 2) throw notFound("Person");
		const all = await relationships.findAll({ Type: r.Type });
		const duplicate = all.find(
			(x) =>
				x.Id !== exceptId &&
				((x.PersonId === r.PersonId &&
					x.RelatedPersonId === r.RelatedPersonId) ||
					(SYMMETRIC.includes(r.Type) &&
						x.PersonId === r.RelatedPersonId &&
						x.RelatedPersonId === r.PersonId))
		);
		if (duplicate) throw new HttpError(409, "Relationship already exists");
		if (r.Type === "Parent") {
			const reverse = all.find(
				(x) =>
					x.PersonId === r.RelatedPersonId &&
					x.RelatedPersonId === r.PersonId
			);
			if (reverse) {
				throw new HttpError(
					400,
					"A person cannot be parent of its own parent"
				);
			}
		}
	};

	/**
	 * GET /api/v1/relationships
	 * @tags relationships
	 * @summary Relationships, optionally of one person (both directions)
	 * @security BearerAuth
	 * @param {string} personId.query - person id
	 * @return {array<object>} 200 - relationships
	 */
	router.get(
		"/",
		read,
		handle(async (req, res) => {
			const personId = req.query.personId;
			if (typeof personId === "string") {
				const [a, b] = await Promise.all([
					relationships.findAll({ PersonId: personId }),
					relationships.findAll({ RelatedPersonId: personId }),
				]);
				res.send([...a, ...b]);
				return;
			}
			res.send(await relationships.findAll());
		})
	);

	/**
	 * GET /api/v1/relationships/{id}
	 * @tags relationships
	 * @summary One relationship
	 * @security BearerAuth
	 * @param {string} id.path.required - relationship id
	 * @return {object} 200 - relationship
	 */
	router.get(
		"/:id",
		read,
		handle(async (req, res) => {
			const r = await relationships.findById(req.params.id);
			if (!r) throw notFound("Relationship");
			res.send(r);
		})
	);

	/**
	 * POST /api/v1/relationships
	 * @tags relationships
	 * @summary Link two persons (Editor). Type "Parent": PersonId is parent of RelatedPersonId.
	 * @security BearerAuth
	 * @param {object} request.body.required - { PersonId, RelatedPersonId, Type, Role, StartDate, EndDate, Notes }
	 * @return {object} 201 - relationship
	 */
	router.post(
		"/",
		write,
		handle(async (req, res) => {
			const body = parse(relationshipSchema, req.body);
			const relationship = canonical<Relationship>({
				Id: crypto.randomUUID(),
				...body,
			});
			await validate(relationship);
			await relationships.create(relationship);
			res.status(201).send(relationship);
		})
	);

	/**
	 * PUT /api/v1/relationships/{id}
	 * @tags relationships
	 * @summary Update a relationship (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - relationship id
	 * @return {object} 200 - relationship
	 */
	router.put(
		"/:id",
		write,
		handle(async (req, res) => {
			const existing = await relationships.findById(req.params.id);
			if (!existing) throw notFound("Relationship");
			const patch = parse(relationshipSchema.partial(), req.body);
			const merged = canonical<Relationship>({ ...existing, ...patch });
			await validate(merged, existing.Id);
			res.send(await relationships.update(existing.Id, merged));
		})
	);

	/**
	 * DELETE /api/v1/relationships/{id}
	 * @tags relationships
	 * @summary Delete a relationship (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - relationship id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		write,
		handle(async (req, res) => {
			if (!(await relationships.delete(req.params.id))) {
				throw notFound("Relationship");
			}
			res.send({ success: true });
		})
	);

	return router;
}
