import { z } from "zod";
import { EVENT_TYPES, GENDERS } from "../models/person.model.js";
import { RELATIONSHIP_TYPES } from "../models/relationship.model.js";
import { MEDIA_TYPES } from "../models/media.model.js";
import { ROLES } from "../models/user.model.js";

const text = (max = 2000) => z.string().trim().max(max);

/** Accepts YYYY, YYYY-MM or YYYY-MM-DD (genealogical dates are often partial) */
const date = z
	.string()
	.regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Expected YYYY, YYYY-MM or YYYY-MM-DD")
	.nullable();

/** Names may be sent as array or as space separated string */
const names = z
	.union([z.array(text(100)), text(500)])
	.transform((v) =>
		(Array.isArray(v) ? v : v.split(/\s+/))
			.map((s) => s.trim())
			.filter(Boolean)
	);

const eventSchema = z.object({
	Type: z.enum(EVENT_TYPES),
	Date: date.default(null),
	Place: text(200).nullable().default(null),
	Description: text(1000).default(""),
});

const sourceSchema = z.object({
	Title: text(500).min(1),
	Citation: text(1000).default(""),
	Url: z.string().trim().url().max(2000).nullable().default(null),
});

export const personSchema = z.object({
	FirstNames: names,
	MiddleNames: names.default([]),
	LastNames: names,
	BirthName: text(200).nullable().default(null),
	Gender: z.enum(GENDERS).default("Unknown"),
	DateOfBirth: date.default(null),
	PlaceOfBirth: text(200).nullable().default(null),
	DateOfDeath: date.default(null),
	PlaceOfDeath: text(200).nullable().default(null),
	CauseOfDeath: text(500).nullable().default(null),
	Notes: text(10000).default(""),
	Events: z.array(eventSchema).max(200).default([]),
	Sources: z.array(sourceSchema).max(200).default([]),
});

export const familySchema = z.object({
	Name: text(200).min(1),
	Description: text(5000).default(""),
	Notes: text(10000).default(""),
	HistoricalNames: z.array(text(200)).default([]),
});

export const membershipSchema = z.object({
	FamilyId: z.string().uuid(),
	PersonId: z.string().uuid(),
	Role: text(100).default("Member"),
	StartDate: date.default(null),
	EndDate: date.default(null),
	Notes: text(5000).default(""),
});

export const relationshipSchema = z.object({
	PersonId: z.string().uuid(),
	RelatedPersonId: z.string().uuid(),
	Type: z.enum(RELATIONSHIP_TYPES),
	Role: text(100).default(""),
	StartDate: date.default(null),
	EndDate: date.default(null),
	Notes: text(5000).default(""),
});

export const mediaSchema = z.object({
	PersonId: z.string().uuid(),
	Title: text(200).min(1),
	Description: text(5000).default(""),
	Type: z.enum(MEDIA_TYPES).optional(),
	Content: text(200000).nullable().default(null),
});

export const tagSchema = z.object({
	PersonId: z.string().uuid(),
	X: z.coerce.number().min(0).max(1).nullable().default(null),
	Y: z.coerce.number().min(0).max(1).nullable().default(null),
	Notes: text(2000).default(""),
});

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8).max(200);

export const userCreateSchema = z.object({
	Name: text(100).min(1),
	Email: email,
	Password: password,
	Role: z.enum(ROLES).default("Viewer"),
});

export const userUpdateSchema = z
	.object({
		Name: text(100).min(1),
		Email: email,
		Password: password,
		Role: z.enum(ROLES),
	})
	.partial();

export const loginSchema = z.object({
	Email: z.string().trim(),
	Password: z.string(),
});

export const passwordChangeSchema = z.object({
	CurrentPassword: z.string(),
	NewPassword: password,
});

/**
 * Schema for partial updates: every field optional and without default values,
 * so fields that are not sent keep their stored value.
 * (`.partial()` alone would still fill in the defaults.)
 */
export function patchSchema<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
	const shape = Object.fromEntries(
		Object.entries(schema.shape).map(([key, field]) => [
			key,
			(field instanceof z.ZodDefault
				? (field.unwrap() as z.ZodType)
				: (field as z.ZodType)
			).optional(),
		])
	);
	return z.object(shape) as unknown as ReturnType<z.ZodObject<S>["partial"]>;
}
