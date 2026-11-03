import { Person } from "../models/person.model.js";
import { Relationship } from "../models/relationship.model.js";
import { toGedcomDate } from "./dates.js";

const MAX_LINE = 240;

/** Writes a value with CONT (line breaks) and CONC (long lines) */
function line(
	out: string[],
	level: number,
	tag: string,
	value?: string | null,
	xref?: string
) {
	const prefix = `${level}${xref ? ` ${xref}` : ""} ${tag}`;
	if (value === undefined || value === null || value === "") {
		out.push(prefix);
		return;
	}
	value.split(/\r?\n/).forEach((part, i) => {
		const chunks = part.match(
			new RegExp(`[\\s\\S]{1,${MAX_LINE}}`, "g")
		) ?? [""];
		chunks.forEach((chunk, j) => {
			if (i === 0 && j === 0) out.push(`${prefix} ${chunk}`);
			else
				out.push(
					`${level + 1} ${j === 0 ? "CONT" : "CONC"}${
						chunk ? ` ${chunk}` : ""
					}`
				);
		});
	});
}

const SEX: Record<Person["Gender"], string> = {
	Male: "M",
	Female: "F",
	Diverse: "X",
	Unknown: "U",
};

interface FamilyUnit {
	parents: string[];
	children: string[];
	marriage: Relationship | null;
}

/**
 * Builds GEDCOM families (couples with their children) from the relationships.
 */
function buildFamilies(
	persons: Map<string, Person>,
	relationships: Relationship[]
): FamilyUnit[] {
	const units = new Map<string, FamilyUnit>();
	const unit = (parents: string[]) => {
		const sorted = [...parents].sort();
		const key = sorted.join("|");
		if (!units.has(key))
			units.set(key, { parents: sorted, children: [], marriage: null });
		return units.get(key)!;
	};

	for (const r of relationships) {
		if (
			(r.Type === "Spouse" || r.Type === "Partner") &&
			persons.has(r.PersonId) &&
			persons.has(r.RelatedPersonId)
		) {
			unit([r.PersonId, r.RelatedPersonId]).marriage = r;
		}
	}

	const parentsOf = new Map<string, string[]>();
	for (const r of relationships) {
		if (
			r.Type !== "Parent" ||
			!persons.has(r.PersonId) ||
			!persons.has(r.RelatedPersonId)
		)
			continue;
		parentsOf.set(r.RelatedPersonId, [
			...(parentsOf.get(r.RelatedPersonId) ?? []),
			r.PersonId,
		]);
	}
	for (const [childId, parents] of parentsOf) {
		// GEDCOM families have at most two parents
		unit(parents.slice(0, 2)).children.push(childId);
	}
	return [...units.values()];
}

/** Exports persons and relationships as GEDCOM 5.5.1 (UTF-8) */
export function exportGedcom(
	personList: Person[],
	relationships: Relationship[],
	meta: { name: string; version: string }
): string {
	const out: string[] = [];
	const persons = new Map(personList.map((p) => [p.Id, p]));
	const xref = new Map(personList.map((p, i) => [p.Id, `@I${i + 1}@`]));
	const families = buildFamilies(persons, relationships);
	const famXref = families.map((_, i) => `@F${i + 1}@`);

	const today = new Date();
	line(out, 0, "HEAD");
	line(out, 1, "SOUR", "FAMILY_CHRONICLES");
	line(out, 2, "VERS", meta.version);
	line(out, 2, "NAME", meta.name);
	line(out, 1, "DATE", toGedcomDate(today.toISOString().slice(0, 10)));
	line(out, 1, "GEDC");
	line(out, 2, "VERS", "5.5.1");
	line(out, 2, "FORM", "LINEAGE-LINKED");
	line(out, 1, "CHAR", "UTF-8");

	for (const p of personList) {
		line(out, 0, "INDI", null, xref.get(p.Id));
		const given = [...p.FirstNames, ...p.MiddleNames].join(" ");
		const surname = p.LastNames.join(" ");
		line(out, 1, "NAME", `${given} /${surname}/`.trim());
		if (given) line(out, 2, "GIVN", given);
		if (surname) line(out, 2, "SURN", surname);
		if (p.BirthName) {
			line(out, 1, "NAME", `${given} /${p.BirthName}/`.trim());
			line(out, 2, "TYPE", "birth");
		}
		line(out, 1, "SEX", SEX[p.Gender]);
		if (p.DateOfBirth || p.PlaceOfBirth) {
			line(out, 1, "BIRT");
			line(out, 2, "DATE", toGedcomDate(p.DateOfBirth));
			if (p.PlaceOfBirth) line(out, 2, "PLAC", p.PlaceOfBirth);
		}
		if (p.DateOfDeath || p.PlaceOfDeath || p.CauseOfDeath) {
			line(out, 1, "DEAT", p.DateOfDeath || p.PlaceOfDeath ? null : "Y");
			if (p.DateOfDeath)
				line(out, 2, "DATE", toGedcomDate(p.DateOfDeath));
			if (p.PlaceOfDeath) line(out, 2, "PLAC", p.PlaceOfDeath);
			if (p.CauseOfDeath) line(out, 2, "CAUS", p.CauseOfDeath);
		}
		if (p.Notes) line(out, 1, "NOTE", p.Notes);
		families.forEach((f, i) => {
			if (f.parents.includes(p.Id)) line(out, 1, "FAMS", famXref[i]);
		});
		families.forEach((f, i) => {
			if (f.children.includes(p.Id)) line(out, 1, "FAMC", famXref[i]);
		});
	}

	families.forEach((f, i) => {
		line(out, 0, "FAM", null, famXref[i]);
		const [a, b] = f.parents.map((id) => persons.get(id)!);
		// HUSB/WIFE by gender where possible
		const [husb, wife] =
			a?.Gender === "Female" || b?.Gender === "Male" ? [b, a] : [a, b];
		if (husb) line(out, 1, "HUSB", xref.get(husb.Id));
		if (wife) line(out, 1, "WIFE", xref.get(wife.Id));
		for (const c of f.children) line(out, 1, "CHIL", xref.get(c));
		if (f.marriage?.Type === "Spouse") {
			line(out, 1, "MARR", f.marriage.StartDate ? null : "Y");
			if (f.marriage.StartDate)
				line(out, 2, "DATE", toGedcomDate(f.marriage.StartDate));
			if (f.marriage.EndDate) {
				line(out, 1, "DIV");
				line(out, 2, "DATE", toGedcomDate(f.marriage.EndDate));
			}
		}
		if (f.marriage?.Notes) line(out, 1, "NOTE", f.marriage.Notes);
	});

	line(out, 0, "TRLR");
	return out.join("\r\n") + "\r\n";
}
