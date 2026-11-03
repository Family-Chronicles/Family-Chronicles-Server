import { IModel } from "../interfaces/model.interface.js";
import { Filter, IRepository } from "./repository.interface.js";

const clone = <T>(value: T): T => structuredClone(value);

function matches<T>(entity: T, filter?: Filter<T>): boolean {
	if (!filter) return true;
	return Object.entries(filter).every(
		([key, value]) => (entity as Record<string, unknown>)[key] === value
	);
}

/**
 * In-memory repository – used for tests and for running without MongoDB.
 */
export class MemoryRepository<T extends IModel> implements IRepository<T> {
	private items = new Map<string, T>();

	async findAll(filter?: Filter<T>): Promise<T[]> {
		return [...this.items.values()]
			.filter((item) => matches(item, filter))
			.map(clone);
	}

	async findById(id: string): Promise<T | null> {
		const item = this.items.get(id);
		return item ? clone(item) : null;
	}

	async findOne(filter: Filter<T>): Promise<T | null> {
		const item = [...this.items.values()].find((i) => matches(i, filter));
		return item ? clone(item) : null;
	}

	async findByIds(ids: string[]): Promise<T[]> {
		return ids
			.map((id) => this.items.get(id))
			.filter((i): i is T => i !== undefined)
			.map(clone);
	}

	async count(filter?: Filter<T>): Promise<number> {
		return (await this.findAll(filter)).length;
	}

	async create(entity: T): Promise<T> {
		this.items.set(entity.Id, clone(entity));
		return clone(entity);
	}

	async update(id: string, patch: Partial<T>): Promise<T | null> {
		const item = this.items.get(id);
		if (!item) return null;
		const updated = { ...item, ...clone(patch), Id: item.Id };
		this.items.set(id, updated);
		return clone(updated);
	}

	async delete(id: string): Promise<boolean> {
		return this.items.delete(id);
	}

	async deleteMany(filter: Filter<T>): Promise<number> {
		let removed = 0;
		for (const [id, item] of this.items) {
			if (matches(item, filter)) {
				this.items.delete(id);
				removed++;
			}
		}
		return removed;
	}
}
