import crypto from "crypto";
import { Collection, Db, Document, ObjectId } from "mongodb";
import { ChangeBus, ChangeEvent } from "./events.srvs.js";

const COLLECTION = "live_events";
const SIZE_BYTES = 8 * 1024 * 1024;
const RETRY_MS = 1000;

interface RelayDocument {
	_id?: ObjectId;
	Instance: string;
	Event: ChangeEvent | null;
	CreatedAt: Date;
}

/**
 * Shares change events between several server instances that use the same MongoDB.
 *
 * Every instance writes its own changes into a capped collection and follows it with
 * a tailable cursor. Events written by other instances are published on the local
 * ChangeBus (marked as Remote), so their WebSocket clients get them too.
 * Works with a standalone MongoDB – no replica set or Redis needed.
 */
export class MongoEventRelay {
	public readonly instance = crypto.randomUUID();
	private collection!: Collection<RelayDocument>;
	private stopped = false;
	private unsubscribe: () => void = () => undefined;
	private lastId: ObjectId | null = null;
	private ready!: Promise<void>;

	constructor(private readonly db: Db, private readonly bus: ChangeBus) {}

	public async start(): Promise<void> {
		const exists = await this.db
			.listCollections({ name: COLLECTION })
			.hasNext();
		if (!exists) {
			try {
				await this.db.createCollection(COLLECTION, {
					capped: true,
					size: SIZE_BYTES,
				});
			} catch (error) {
				// another instance created it at the same time
				if (
					(error as { codeName?: string }).codeName !==
					"NamespaceExists"
				)
					throw error;
			}
		}
		this.collection = this.db.collection<RelayDocument>(COLLECTION);
		// a tailable cursor needs at least one document
		const latest = await this.collection
			.find()
			.sort({ $natural: -1 })
			.limit(1)
			.next();
		if (latest) {
			this.lastId = latest._id!;
		} else {
			const inserted = await this.collection.insertOne({
				Instance: this.instance,
				Event: null,
				CreatedAt: new Date(),
			});
			this.lastId = inserted.insertedId;
		}

		this.unsubscribe = this.bus.subscribe((event) => {
			if (event.Remote) return; // do not send received events back
			this.collection
				.insertOne({
					Instance: this.instance,
					Event: event,
					CreatedAt: new Date(),
				})
				.catch((error) =>
					console.error("Live relay: could not publish event", error)
				);
		});

		let markReady!: () => void;
		this.ready = new Promise((resolve) => (markReady = resolve));
		void this.follow(markReady);
	}

	/** Resolves once the relay listens for events of other instances */
	public whenReady(): Promise<void> {
		return this.ready;
	}

	private async follow(markReady: () => void): Promise<void> {
		while (!this.stopped) {
			const cursor = this.collection.find(
				{ _id: { $gt: this.lastId! } } as Document,
				{ tailable: true, awaitData: true, maxAwaitTimeMS: 1000 }
			);
			markReady();
			try {
				for await (const doc of cursor) {
					if (this.stopped) break;
					this.lastId = doc._id!;
					if (doc.Instance !== this.instance && doc.Event) {
						this.bus.publish({ ...doc.Event, Remote: true });
					}
				}
			} catch (error) {
				if (!this.stopped)
					console.error("Live relay: cursor error, retrying", error);
			} finally {
				await cursor.close().catch(() => undefined);
			}
			if (!this.stopped)
				await new Promise((r) => setTimeout(r, RETRY_MS));
		}
	}

	public stop(): void {
		this.stopped = true;
		this.unsubscribe();
	}
}
