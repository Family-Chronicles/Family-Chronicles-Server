import { EventEmitter } from "events";
import { IModel } from "../interfaces/model.interface.js";
import {
	Filter,
	IRepository,
	QueryOptions,
} from "../repositories/repository.interface.js";

export type ChangeAction = "created" | "updated" | "deleted";

/** A change of stored data. Contains ids only – clients load the data themselves. */
export interface ChangeEvent {
	Entity: string;
	Action: ChangeAction;
	/** Changed ids, or null when too many changed at once (e.g. an import) */
	Ids: string[] | null;
	/** True when the change happened on another server instance (see MongoEventRelay) */
	Remote?: boolean;
}

const MAX_IDS = 100;

/** Publishes data changes inside the server (e.g. to the WebSocket clients) */
export class ChangeBus {
	private emitter = new EventEmitter();

	constructor() {
		this.emitter.setMaxListeners(0);
	}

	public emit(
		entity: string,
		action: ChangeAction,
		ids: string[] | null
	): void {
		if (ids && ids.length === 0) return;
		this.publish({
			Entity: entity,
			Action: action,
			Ids: ids && ids.length <= MAX_IDS ? ids : null,
		});
	}

	/** Publishes a complete event, e.g. one received from another instance */
	public publish(event: ChangeEvent): void {
		this.emitter.emit("change", event);
	}

	public subscribe(listener: (event: ChangeEvent) => void): () => void {
		this.emitter.on("change", listener);
		return () => this.emitter.off("change", listener);
	}
}

/**
 * Repository decorator that reports every successful write to the change bus.
 */
export class ObservableRepository<T extends IModel> implements IRepository<T> {
	constructor(
		private readonly inner: IRepository<T>,
		private readonly entity: string,
		private readonly bus: ChangeBus
	) {}

	findAll(filter?: Filter<T>) {
		return this.inner.findAll(filter);
	}
	findById(id: string) {
		return this.inner.findById(id);
	}
	findOne(filter: Filter<T>) {
		return this.inner.findOne(filter);
	}
	findByIds(ids: string[]) {
		return this.inner.findByIds(ids);
	}
	query(options: QueryOptions<T>) {
		return this.inner.query(options);
	}
	count(filter?: Filter<T>) {
		return this.inner.count(filter);
	}

	async create(entity: T): Promise<T> {
		const created = await this.inner.create(entity);
		this.bus.emit(this.entity, "created", [created.Id]);
		return created;
	}

	async createMany(entities: T[]): Promise<number> {
		const count = await this.inner.createMany(entities);
		this.bus.emit(
			this.entity,
			"created",
			entities.map((e) => e.Id)
		);
		return count;
	}

	async update(id: string, patch: Partial<T>): Promise<T | null> {
		const updated = await this.inner.update(id, patch);
		if (updated) this.bus.emit(this.entity, "updated", [id]);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const deleted = await this.inner.delete(id);
		if (deleted) this.bus.emit(this.entity, "deleted", [id]);
		return deleted;
	}

	async deleteMany(filter: Filter<T>): Promise<number> {
		const ids = (await this.inner.findAll(filter)).map((e) => e.Id);
		const count = await this.inner.deleteMany(filter);
		if (count > 0) this.bus.emit(this.entity, "deleted", ids);
		return count;
	}
}
