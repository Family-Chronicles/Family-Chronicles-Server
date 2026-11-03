import { Repositories } from "./database.srvs.js";
import { Person, withSearchFields } from "../models/person.model.js";
import { Relationship } from "../models/relationship.model.js";
import { FileStorage } from "../storage/file.storage.js";

export interface AncestorNode {
	Person: Person;
	Parents: AncestorNode[];
}

export interface DescendantNode {
	Person: Person;
	Partners: Person[];
	Children: DescendantNode[];
}

export interface FamilyTree {
	Root: Person;
	Ancestors: AncestorNode;
	Descendants: DescendantNode;
	Siblings: Person[];
}

const PARTNER_TYPES = ["Spouse", "Partner"];

/**
 * Domain logic that spans several collections.
 */
export class GenealogyService {
	constructor(
		private readonly repos: Repositories,
		private readonly storage: FileStorage
	) {}

	/** Adds search fields to persons stored before they existed. Returns the number of updated persons. */
	public async backfillSearchFields(): Promise<number> {
		const { items } = await this.repos.persons.query({
			notNull: [{ field: "SortName", value: false }],
		});
		for (const p of items) {
			const { SearchText, SortName } = withSearchFields(p);
			await this.repos.persons.update(p.Id, {
				SearchText,
				SortName,
				// fields added later get their empty default
				Events: p.Events ?? [],
				Sources: p.Sources ?? [],
			});
		}
		return items.length;
	}

	/** Deletes a person including all links, memberships, tags and media */
	public async deletePerson(id: string): Promise<boolean> {
		const { persons, relationships, memberships, tags, media } = this.repos;
		if (!(await persons.delete(id))) return false;
		await relationships.deleteMany({ PersonId: id });
		await relationships.deleteMany({ RelatedPersonId: id });
		await memberships.deleteMany({ PersonId: id });
		await this.repos.links.deleteMany({ PersonId: id });
		await tags.deleteMany({ PersonId: id });
		for (const item of await media.findAll({ PersonId: id })) {
			await this.deleteMedia(item.Id);
		}
		return true;
	}

	public async deleteFamily(id: string): Promise<boolean> {
		if (!(await this.repos.families.delete(id))) return false;
		await this.repos.memberships.deleteMany({ FamilyId: id });
		return true;
	}

	public async deleteMedia(id: string): Promise<boolean> {
		const item = await this.repos.media.findById(id);
		if (!item) return false;
		await this.repos.media.delete(id);
		await this.repos.tags.deleteMany({ MediaId: id });
		if (item.StorageKey) await this.storage.remove(item.StorageKey);
		return true;
	}

	/** Distinct last names of all members – a family is defined by them */
	public async familySurnames(familyId: string): Promise<string[]> {
		const links = await this.repos.memberships.findAll({
			FamilyId: familyId,
		});
		const members = await this.repos.persons.findByIds(
			links.map((l) => l.PersonId)
		);
		const names = new Set<string>();
		members.forEach((p) => p.LastNames.forEach((n) => names.add(n)));
		return [...names].sort((a, b) => a.localeCompare(b));
	}

	/** Ancestors and descendants of a person up to `depth` generations */
	public async tree(
		rootId: string,
		depth: number
	): Promise<FamilyTree | null> {
		const root = await this.repos.persons.findById(rootId);
		if (!root) return null;

		const [allPersons, allLinks] = await Promise.all([
			this.repos.persons.findAll(),
			this.repos.relationships.findAll(),
		]);
		const byId = new Map(allPersons.map((p) => [p.Id, p]));
		const parentLinks = allLinks.filter((l) => l.Type === "Parent");

		const parentsOf = (id: string) =>
			parentLinks
				.filter((l) => l.RelatedPersonId === id)
				.map((l) => l.PersonId);
		const childrenOf = (id: string) =>
			parentLinks
				.filter((l) => l.PersonId === id)
				.map((l) => l.RelatedPersonId);
		const partnersOf = (id: string) =>
			allLinks
				.filter((l) => PARTNER_TYPES.includes(l.Type))
				.flatMap((l: Relationship) =>
					l.PersonId === id
						? [l.RelatedPersonId]
						: l.RelatedPersonId === id
						? [l.PersonId]
						: []
				);
		const resolve = (ids: string[]) =>
			[...new Set(ids)]
				.map((id) => byId.get(id))
				.filter((p): p is Person => !!p);

		// `seen` protects against cycles in faulty data
		const ancestors = (
			p: Person,
			d: number,
			seen: Set<string>
		): AncestorNode => ({
			Person: p,
			Parents:
				d <= 0
					? []
					: resolve(parentsOf(p.Id))
							.filter((x) => !seen.has(x.Id))
							.map((x) =>
								ancestors(x, d - 1, new Set([...seen, x.Id]))
							),
		});
		const descendants = (
			p: Person,
			d: number,
			seen: Set<string>
		): DescendantNode => ({
			Person: p,
			Partners: resolve(partnersOf(p.Id)),
			Children:
				d <= 0
					? []
					: resolve(childrenOf(p.Id))
							.filter((x) => !seen.has(x.Id))
							.map((x) =>
								descendants(x, d - 1, new Set([...seen, x.Id]))
							),
		});

		const parentIds = parentsOf(root.Id);
		const siblingIds = allLinks
			.filter((l) => l.Type === "Sibling")
			.flatMap((l) =>
				l.PersonId === root.Id
					? [l.RelatedPersonId]
					: l.RelatedPersonId === root.Id
					? [l.PersonId]
					: []
			)
			.concat(parentIds.flatMap(childrenOf))
			.filter((id) => id !== root.Id);

		return {
			Root: root,
			Ancestors: ancestors(root, depth, new Set([root.Id])),
			Descendants: descendants(root, depth, new Set([root.Id])),
			Siblings: resolve(siblingIds),
		};
	}
}
