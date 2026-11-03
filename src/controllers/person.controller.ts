import { Router } from "express";
import crypto from "crypto";
import { AppContext } from "../core/context.core.js";
import { handle, notFound, now, parse } from "../core/http.core.js";
import {
	normalizeText,
	Person,
	withSearchFields,
} from "../models/person.model.js";
import {
	escapeRegExp,
	QueryOptions,
} from "../repositories/repository.interface.js";
import { GenealogyService } from "../services/genealogy.srvs.js";
import { patchSchema, personSchema } from "../validation/schemas.js";

export function personController(
	ctx: AppContext,
	genealogy: GenealogyService
): Router {
	const router = Router();
	const { persons, relationships, memberships, families, media, tags } =
		ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");

	const load = async (id: string) => {
		const person = await persons.findById(id);
		if (!person) throw notFound("Person");
		return person;
	};

	/**
	 * GET /api/v1/persons
	 * @tags persons
	 * @summary Persons, searched, filtered and paged. The total number of matches is in the X-Total-Count header.
	 * @security BearerAuth
	 * @param {string} q.query - search in names, birth name and places (all words must match)
	 * @param {string} born.query - date of birth prefix (YYYY, YYYY-MM or YYYY-MM-DD)
	 * @param {string} living.query - "true": only living, "false": only deceased
	 * @param {string} ids.query - comma separated ids, returns exactly these persons
	 * @param {number} limit.query - page size (max 500); without limit all matches are returned
	 * @param {number} offset.query - number of matches to skip
	 * @return {array<object>} 200 - persons, sorted by last name
	 */
	router.get(
		"/",
		read,
		handle(async (req, res) => {
			const str = (key: string) =>
				typeof req.query[key] === "string"
					? (req.query[key] as string)
					: "";

			if (str("ids")) {
				const ids = str("ids").split(",").filter(Boolean).slice(0, 500);
				const found = await persons.findByIds(ids);
				res.setHeader("X-Total-Count", String(found.length));
				res.send(found);
				return;
			}

			const options: QueryOptions<Person> = {
				match: [],
				notNull: [],
				sort: [{ field: "SortName", direction: 1 }],
			};
			for (const term of normalizeText(str("q"))
				.split(/\s+/)
				.filter(Boolean)) {
				options.match!.push({
					field: "SearchText",
					pattern: new RegExp(escapeRegExp(term)),
				});
			}
			if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(str("born"))) {
				options.match!.push({
					field: "DateOfBirth",
					pattern: new RegExp(`^${escapeRegExp(str("born"))}`),
				});
			}
			if (str("living") === "true" || str("living") === "false") {
				options.notNull!.push({
					field: "DateOfDeath",
					value: str("living") === "false",
				});
			}
			const limit = Number(str("limit"));
			if (limit > 0) options.limit = Math.min(limit, 500);
			options.skip = Math.max(Number(str("offset")) || 0, 0);

			const page = await persons.query(options);
			res.setHeader("X-Total-Count", String(page.total));
			res.send(page.items);
		})
	);

	/**
	 * GET /api/v1/persons/{id}
	 * @tags persons
	 * @summary One person
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {object} 200 - person
	 */
	router.get(
		"/:id",
		read,
		handle(async (req, res) => {
			res.send(await load(req.params.id));
		})
	);

	/**
	 * GET /api/v1/persons/{id}/relationships
	 * @tags persons
	 * @summary All relationships of a person (both directions)
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {array<object>} 200 - relationships
	 */
	router.get(
		"/:id/relationships",
		read,
		handle(async (req, res) => {
			const person = await load(req.params.id);
			const [from, to] = await Promise.all([
				relationships.findAll({ PersonId: person.Id }),
				relationships.findAll({ RelatedPersonId: person.Id }),
			]);
			res.send([...from, ...to]);
		})
	);

	/**
	 * GET /api/v1/persons/{id}/families
	 * @tags persons
	 * @summary Family memberships of a person, including the family
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {array<object>} 200 - memberships with Family
	 */
	router.get(
		"/:id/families",
		read,
		handle(async (req, res) => {
			const person = await load(req.params.id);
			const links = await memberships.findAll({ PersonId: person.Id });
			const fams = await families.findByIds(links.map((l) => l.FamilyId));
			res.send(
				links.map((l) => ({
					...l,
					Family: fams.find((f) => f.Id === l.FamilyId) ?? null,
				}))
			);
		})
	);

	/**
	 * GET /api/v1/persons/{id}/media
	 * @tags persons
	 * @summary Media owned by the person and media the person is tagged on
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {object} 200 - { Own: [], Tagged: [] }
	 */
	router.get(
		"/:id/media",
		read,
		handle(async (req, res) => {
			const person = await load(req.params.id);
			const own = await media.findAll({ PersonId: person.Id });
			const tagLinks = await tags.findAll({ PersonId: person.Id });
			const tagged = (
				await media.findByIds([
					...new Set(tagLinks.map((t) => t.MediaId)),
				])
			).filter((m) => m.PersonId !== person.Id);
			res.send({ Own: own, Tagged: tagged });
		})
	);

	/**
	 * GET /api/v1/persons/{id}/tree
	 * @tags persons
	 * @summary Ancestors, descendants and siblings of a person
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @param {number} depth.query - generations in each direction (1-10, default 3)
	 * @return {object} 200 - tree
	 */
	router.get(
		"/:id/tree",
		read,
		handle(async (req, res) => {
			const depth = Math.min(
				Math.max(Number(req.query.depth) || 3, 1),
				10
			);
			const tree = await genealogy.tree(req.params.id, depth);
			if (!tree) throw notFound("Person");
			res.send(tree);
		})
	);

	/**
	 * POST /api/v1/persons
	 * @tags persons
	 * @summary Create a person (Editor)
	 * @security BearerAuth
	 * @param {object} request.body.required - person
	 * @return {object} 201 - person
	 */
	router.post(
		"/",
		write,
		handle(async (req, res) => {
			const body = parse(personSchema, req.body);
			const person: Person = withSearchFields({
				Id: crypto.randomUUID(),
				...body,
				CreatedAt: now(),
				UpdatedAt: now(),
			});
			await persons.create(person);
			res.status(201).send(person);
		})
	);

	/**
	 * PUT /api/v1/persons/{id}
	 * @tags persons
	 * @summary Update a person, only sent fields change (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {object} 200 - person
	 */
	router.put(
		"/:id",
		write,
		handle(async (req, res) => {
			const person = await load(req.params.id);
			const patch = parse(patchSchema(personSchema), req.body);
			res.send(
				await persons.update(
					person.Id,
					withSearchFields({ ...person, ...patch, UpdatedAt: now() })
				)
			);
		})
	);

	/**
	 * DELETE /api/v1/persons/{id}
	 * @tags persons
	 * @summary Delete a person with all links and media (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - person id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		write,
		handle(async (req, res) => {
			if (!(await genealogy.deletePerson(req.params.id))) {
				throw notFound("Person");
			}
			res.send({ success: true });
		})
	);

	return router;
}
