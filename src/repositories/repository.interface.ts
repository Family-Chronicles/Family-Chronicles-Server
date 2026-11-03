import { IModel } from "../interfaces/model.interface.js";

/** Simple equality filter on top-level fields */
export type Filter<T> = Partial<T>;

/** Options for paged and searched access (see IRepository.query) */
export interface QueryOptions<T> {
	/** Equality filter */
	where?: Filter<T>;
	/** All patterns must match the string value of their field */
	match?: { field: keyof T & string; pattern: RegExp }[];
	/** Fields that must (true) or must not (false) be null */
	notNull?: { field: keyof T & string; value: boolean }[];
	sort?: { field: keyof T & string; direction: 1 | -1 }[];
	skip?: number;
	limit?: number;
}

export interface Page<T> {
	items: T[];
	total: number;
}

/** Escapes user input for use in a RegExp */
export const escapeRegExp = (s: string) =>
	s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Storage-independent access to one collection.
 */
export interface IRepository<T extends IModel> {
	findAll(filter?: Filter<T>): Promise<T[]>;
	findById(id: string): Promise<T | null>;
	findOne(filter: Filter<T>): Promise<T | null>;
	findByIds(ids: string[]): Promise<T[]>;
	/** Filtered, sorted and paged list plus the total number of matches */
	query(options: QueryOptions<T>): Promise<Page<T>>;
	count(filter?: Filter<T>): Promise<number>;
	create(entity: T): Promise<T>;
	/** Inserts many entities at once (e.g. for imports) */
	createMany(entities: T[]): Promise<number>;
	/** Returns the updated entity or null when it does not exist */
	update(id: string, patch: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
	deleteMany(filter: Filter<T>): Promise<number>;
}
