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
	CreatedAt: string;
	UpdatedAt: string;
}

export function fullName(person: Person): string {
	return [...person.FirstNames, ...person.MiddleNames, ...person.LastNames]
		.filter(Boolean)
		.join(" ");
}
