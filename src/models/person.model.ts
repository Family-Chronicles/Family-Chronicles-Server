import { DateString, IModel } from "../interfaces/model.interface.js";

export const GENDERS = ["Male", "Female", "Diverse", "Unknown"] as const;
export type Gender = (typeof GENDERS)[number];

export interface Person extends IModel {
	FirstNames: string[];
	MiddleNames: string[];
	LastNames: string[];
	BirthName: string | null;
	Gender: Gender;
	DateOfBirth: DateString;
	PlaceOfBirth: string | null;
	DateOfDeath: DateString;
	PlaceOfDeath: string | null;
	CauseOfDeath: string | null;
	Notes: string;
	/** Derived: normalized names and places for searching (see withSearchFields) */
	SearchText?: string;
	/** Derived: normalized "last names first names" for sorting */
	SortName?: string;
	CreatedAt: string;
	UpdatedAt: string;
}

/** Lower case without accents, for search and sort */
export const normalizeText = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

/** Adds the derived search and sort fields */
export function withSearchFields<P extends Person>(p: P): P {
	return {
		...p,
		SearchText: normalizeText(
			[fullName(p), p.BirthName, p.PlaceOfBirth, p.PlaceOfDeath]
				.filter(Boolean)
				.join(" ")
		),
		SortName: normalizeText(
			`${p.LastNames.join(" ")} ${p.FirstNames.join(" ")}`
		),
	};
}

export function fullName(person: Person): string {
	return [...person.FirstNames, ...person.MiddleNames, ...person.LastNames]
		.filter(Boolean)
		.join(" ");
}
