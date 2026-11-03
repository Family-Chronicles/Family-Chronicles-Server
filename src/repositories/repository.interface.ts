import { IModel } from "../interfaces/model.interface.js";

/** Simple equality filter on top-level fields */
export type Filter<T> = Partial<T>;

/**
 * Storage-independent access to one collection.
 */
export interface IRepository<T extends IModel> {
	findAll(filter?: Filter<T>): Promise<T[]>;
	findById(id: string): Promise<T | null>;
	findOne(filter: Filter<T>): Promise<T | null>;
	findByIds(ids: string[]): Promise<T[]>;
	count(filter?: Filter<T>): Promise<number>;
	create(entity: T): Promise<T>;
	/** Inserts many entities at once (e.g. for imports) */
	createMany(entities: T[]): Promise<number>;
	/** Returns the updated entity or null when it does not exist */
	update(id: string, patch: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
	deleteMany(filter: Filter<T>): Promise<number>;
}
