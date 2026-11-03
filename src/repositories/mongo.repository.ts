import { Collection, Db, Document, Filter as MongoFilter } from "mongodb";
import { IModel } from "../interfaces/model.interface.js";
import { Filter, IRepository } from "./repository.interface.js";

const PROJECTION = { projection: { _id: 0 } };

/**
 * MongoDB repository. Entities are identified by their own `Id` (GUID),
 * the Mongo `_id` is never exposed.
 */
export class MongoRepository<T extends IModel> implements IRepository<T> {
	private collection: Collection;

	constructor(db: Db, collectionName: string) {
		this.collection = db.collection(collectionName);
	}

	public async ensureIndexes(): Promise<void> {
		await this.collection.createIndex({ Id: 1 }, { unique: true });
	}

	private filter(filter?: Filter<T>): MongoFilter<Document> {
		return (filter ?? {}) as MongoFilter<Document>;
	}

	async findAll(filter?: Filter<T>): Promise<T[]> {
		return (await this.collection
			.find(this.filter(filter), PROJECTION)
			.toArray()) as unknown as T[];
	}

	async findById(id: string): Promise<T | null> {
		return (await this.collection.findOne(
			{ Id: id },
			PROJECTION
		)) as unknown as T | null;
	}

	async findOne(filter: Filter<T>): Promise<T | null> {
		return (await this.collection.findOne(
			this.filter(filter),
			PROJECTION
		)) as unknown as T | null;
	}

	async findByIds(ids: string[]): Promise<T[]> {
		return (await this.collection
			.find({ Id: { $in: ids } }, PROJECTION)
			.toArray()) as unknown as T[];
	}

	async count(filter?: Filter<T>): Promise<number> {
		return this.collection.countDocuments(this.filter(filter));
	}

	async create(entity: T): Promise<T> {
		await this.collection.insertOne({ ...entity });
		return entity;
	}

	async update(id: string, patch: Partial<T>): Promise<T | null> {
		const { Id, ...rest } = patch as Partial<T> & { Id?: string };
		const result = await this.collection.findOneAndUpdate(
			{ Id: id },
			{ $set: rest },
			{ returnDocument: "after", projection: { _id: 0 } }
		);
		return (result.value as unknown as T) ?? null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ Id: id });
		return result.deletedCount > 0;
	}

	async deleteMany(filter: Filter<T>): Promise<number> {
		const result = await this.collection.deleteMany(this.filter(filter));
		return result.deletedCount;
	}
}
