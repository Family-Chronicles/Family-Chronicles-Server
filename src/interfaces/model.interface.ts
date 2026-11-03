/**
 * Base interface of all stored entities.
 */
export interface IModel {
	readonly Id: string;
}

/** ISO date string (YYYY-MM-DD) or null when unknown */
export type DateString = string | null;
