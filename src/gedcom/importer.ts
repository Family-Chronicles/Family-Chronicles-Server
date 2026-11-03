import crypto from "crypto";
import { Gender, Person } from "../models/person.model.js";
import { Relationship } from "../models/relationship.model.js";
import { Family, FamilyMembership } from "../models/family.model.js";
import { Repositories } from "../services/database.srvs.js";
import { fromGedcomDate } from "./dates.js";
import {
	child,
	childrenOf,
	childValue,
	GedcomNode,
	parseGedcom,
} from "./parser.js";

export interface ImportOptions {
	/** When set, a family with this name is created and all imported persons become members */
	familyName?: string;
}

export interface ImportResult {
	Persons: number;
	Relationships: number;
	FamilyId: string | null;
	Warnings: string[];
}

const SEX: Record<string, Gender> = { M: "Male", F: "Female", X: "Diverse" };

const PEDIGREE_ROLE: Record<string, string> = {
	adopted: "Adoptiert",
	foster: "Pflege",
	sealing: "Sealing",
};

const now = () => new Date().toISOString();

/** "Anna Maria /Müller/" → given and surname parts */
function splitName(node: GedcomNode): { given: string[]; surname: string[] } {
	const [before = "", surname = ""] = node.value.split("/");
	const givn = childValue(node, "GIVN") || before;
	const surn = childValue(node, "SURN") || surname;
	return {
		given: givn.split(/\s+/).filter(Boolean),
		surname: surn.split(/\s+/).filter(Boolean),
	};
}

/**
 * Converts parsed GEDCOM records into persons and relationships and stores them.
 * The import is additive: existing data is not changed or merged.
 */
export async function importGedcom(
	text: string,
	repos: Repositories,
	options: ImportOptions = {}
): Promise<ImportResult> {
	const { records, warnings } = parseGedcom(text);

	const notes = new Map(
		records
			.filter((r) => r.tag === "NOTE" && r.xref)
			.map((r) => [r.xref!, r.value])
	);
	const noteText = (node: GedcomNode) =>
		childrenOf(node, "NOTE")
			.map((n) =>
				/^@[^@]+@$/.test(n.value) ? notes.get(n.value) ?? "" : n.value
			)
			.filter(Boolean)
			.join("\n\n");

	const event = (
		node: GedcomNode,
		tag: string,
		label: string,
		extra: string[]
	) => {
		const ev = child(node, tag);
		if (!ev) return { date: null, place: null, cause: null };
		const rawDate = childValue(ev, "DATE");
		const date = fromGedcomDate(rawDate);
		if (rawDate && date.approximate)
			extra.push(`${label} (GEDCOM): ${rawDate}`);
		return {
			date: date.value,
			place: childValue(ev, "PLAC") || null,
			cause: childValue(ev, "CAUS") || null,
		};
	};

	// --- persons ---
	const persons: Person[] = [];
	const byXref = new Map<string, Person>();
	for (const indi of records.filter((r) => r.tag === "INDI")) {
		if (!indi.xref) {
			warnings.push(`Line ${indi.line}: INDI without id was skipped.`);
			continue;
		}
		const names = childrenOf(indi, "NAME");
		const main =
			names.find(
				(n) => !/^(birth|maiden)$/i.test(childValue(n, "TYPE"))
			) ?? names[0];
		const { given, surname } = main
			? splitName(main)
			: { given: [], surname: [] };
		const birthNameNode = names.find((n) =>
			/^(birth|maiden)$/i.test(childValue(n, "TYPE"))
		);
		const birthName = birthNameNode
			? splitName(birthNameNode).surname.join(" ")
			: "";

		const extra: string[] = [];
		const birth = event(indi, "BIRT", "Birth", extra);
		const death = event(indi, "DEAT", "Death", extra);
		const note = [noteText(indi), ...extra].filter(Boolean).join("\n");

		const person: Person = {
			Id: crypto.randomUUID(),
			FirstNames: given.slice(0, 1).length ? given.slice(0, 1) : ["?"],
			MiddleNames: given.slice(1),
			LastNames: surname,
			BirthName:
				birthName && birthName !== surname.join(" ") ? birthName : null,
			Gender: SEX[childValue(indi, "SEX").toUpperCase()] ?? "Unknown",
			DateOfBirth: birth.date,
			PlaceOfBirth: birth.place,
			DateOfDeath: death.date,
			PlaceOfDeath: death.place,
			CauseOfDeath: death.cause,
			Notes: note.slice(0, 10000),
			CreatedAt: now(),
			UpdatedAt: now(),
		};
		if (!main)
			warnings.push(`Line ${indi.line}: ${indi.xref} has no NAME.`);
		persons.push(person);
		byXref.set(indi.xref, person);
	}

	// pedigree type (adopted, foster, ...) per child and family
	const pedigree = new Map<string, string>();
	for (const indi of records.filter((r) => r.tag === "INDI" && r.xref)) {
		for (const famc of childrenOf(indi, "FAMC")) {
			const pedi = childValue(famc, "PEDI").toLowerCase();
			if (PEDIGREE_ROLE[pedi])
				pedigree.set(`${indi.xref}|${famc.value}`, PEDIGREE_ROLE[pedi]);
		}
	}

	// --- relationships from FAM records ---
	const relationships: Relationship[] = [];
	const seen = new Set<string>();
	const link = (r: Omit<Relationship, "Id">) => {
		const key = `${r.Type}|${[r.PersonId, r.RelatedPersonId].join("|")}`;
		if (seen.has(key)) return;
		seen.add(key);
		relationships.push({ Id: crypto.randomUUID(), ...r });
	};
	const resolve = (fam: GedcomNode, xref: string) => {
		const person = byXref.get(xref);
		if (!person)
			warnings.push(
				`Line ${fam.line}: ${fam.xref} refers to unknown person ${xref}.`
			);
		return person;
	};

	for (const fam of records.filter((r) => r.tag === "FAM")) {
		const parents = [...childrenOf(fam, "HUSB"), ...childrenOf(fam, "WIFE")]
			.map((n) => resolve(fam, n.value.trim()))
			.filter((p): p is Person => !!p);
		const marriage = child(fam, "MARR");
		const divorce = child(fam, "DIV");

		if (parents.length === 2) {
			link({
				PersonId: parents[0].Id,
				RelatedPersonId: parents[1].Id,
				Type: marriage ? "Spouse" : "Partner",
				Role: "",
				StartDate: marriage
					? fromGedcomDate(childValue(marriage, "DATE")).value
					: null,
				EndDate: divorce
					? fromGedcomDate(childValue(divorce, "DATE")).value
					: null,
				Notes: noteText(fam),
			});
		}
		for (const chil of childrenOf(fam, "CHIL")) {
			const kid = resolve(fam, chil.value.trim());
			if (!kid) continue;
			for (const parent of parents) {
				link({
					PersonId: parent.Id,
					RelatedPersonId: kid.Id,
					Type: "Parent",
					Role:
						pedigree.get(`${chil.value.trim()}|${fam.xref}`) ?? "",
					StartDate: null,
					EndDate: null,
					Notes: "",
				});
			}
		}
	}

	await repos.persons.createMany(persons);
	await repos.relationships.createMany(relationships);

	let familyId: string | null = null;
	if (options.familyName?.trim() && persons.length) {
		const family: Family = {
			Id: crypto.randomUUID(),
			Name: options.familyName.trim(),
			Description: "Imported from GEDCOM",
			Notes: "",
			HistoricalNames: [],
			CreatedAt: now(),
			UpdatedAt: now(),
		};
		await repos.families.create(family);
		const memberships: FamilyMembership[] = persons.map((p) => ({
			Id: crypto.randomUUID(),
			FamilyId: family.Id,
			PersonId: p.Id,
			Role: "Member",
			StartDate: null,
			EndDate: null,
			Notes: "",
		}));
		await repos.memberships.createMany(memberships);
		familyId = family.Id;
	}

	return {
		Persons: persons.length,
		Relationships: relationships.length,
		FamilyId: familyId,
		Warnings: warnings,
	};
}
