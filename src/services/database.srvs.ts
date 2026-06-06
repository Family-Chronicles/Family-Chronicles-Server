import {
	Collection,
	Db,
	Document,
	Filter,
	MongoClient,
	MongoClientOptions,
	UpdateFilter,
	UpdateOptions,
} from "mongodb";
import { IModel } from "../interfaces/model.interface.js";
import AuditLogModel from "../models/auditLog.model";
import User from "../models/user.model";
import { Config } from "../types/config.type.js";
import ConfigService from "./config.srvs";

/**
 * Database service
 * @class
 * @implements {IService}
 * @property {Config} config - Config
 * @property {MongoClient} client - MongoDB client
 * @property {Db} db - MongoDB database
 * @constructor
 * @returns {DatabaseService} - Database service instance
 * @example
 * const databaseService = DatabaseService.getInstance();
 * const document = await databaseService.findDocument<DocumentModel>("collection", "id");
 */
export default class DatabaseService {
	static #instance: DatabaseService;
	#config: Config = ConfigService.getInstance().config;
	#client: MongoClient | undefined;
	#db: Db | undefined;
	#connectionPromise: Promise<Db> | undefined;
	#initializationPromise: Promise<void> | undefined;
	#listenersBound = false;

	private constructor() {
		this.#initializationPromise = this.intializeDatabase();
	}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.#instance) {
			DatabaseService.#instance = new DatabaseService();
		}

		return DatabaseService.#instance;
	}

	private async intializeDatabase(): Promise<void> {
		const db = await this.connect();
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map(
			(collection) => collection.name
		);
		const configCollections = [...this.#config.database.collections];
		if (!configCollections.includes("auditlogs")) {
			configCollections.push("auditlogs");
		}
		await Promise.all(
			configCollections.map(async (collection) => {
				if (!collectionNames.includes(collection)) {
					await db.createCollection(collection);
				}
			})
		);
		await this.ensureIndexes(db);
	}

	private async connect(): Promise<Db> {
		if (this.#db) {
			return this.#db;
		}

		if (!this.#connectionPromise) {
			this.#connectionPromise = this.createConnection();
		}

		return this.#connectionPromise;
	}

	private async createConnection(): Promise<Db> {
		try {
			const clientOptions: MongoClientOptions = {
				appName: this.#config.meta.name,
				maxPoolSize: 10,
				minPoolSize: 1,
				maxIdleTimeMS: 60_000,
				retryWrites: true,
			};

			if (
				this.#config.database.username &&
				this.#config.database.password
			) {
				clientOptions.auth = {
					username: this.#config.database.username,
					password: this.#config.database.password,
				};
				clientOptions.authSource =
					process.env.MONGO_AUTH_SOURCE ?? "admin";
			}

			const client = new MongoClient(
				this.#config.database.host,
				clientOptions
			);
			await client.connect();

			this.#client = client;
			this.#db = client.db(this.#config.database.databasename);
			this.setListener(client);

			return this.#db;
		} catch (error) {
			this.#client = undefined;
			this.#db = undefined;
			throw error;
		} finally {
			this.#connectionPromise = undefined;
		}
	}

	private setListener(client: MongoClient): void {
		if (this.#listenersBound) {
			return;
		}

		client.on("close", () => {
			console.warn("MongoDB connection closed.");
			this.resetConnectionState();
		});
		client.on("error", (error) => {
			console.error("MongoDB connection error:", error);
		});

		this.#listenersBound = true;
	}

	private resetConnectionState(): void {
		this.#client = undefined;
		this.#db = undefined;
		this.#connectionPromise = undefined;
		this.#initializationPromise = undefined;
		this.#listenersBound = false;
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.#initializationPromise) {
			this.#initializationPromise = this.intializeDatabase();
		}

		try {
			await this.#initializationPromise;
		} catch (error) {
			this.#initializationPromise = undefined;
			throw error;
		}
	}

	private async getDb(): Promise<Db> {
		await this.ensureInitialized();
		if (this.#db) {
			return this.#db;
		}

		return this.connect();
	}

	private async ensureIndexes(db: Db): Promise<void> {
		await Promise.all([
			this.tryCreateIndex(
				db.collection("users"),
				{ Id: 1 },
				{ name: "users_id_idx" }
			),
			this.tryCreateIndex(
				db.collection("users"),
				{ Name: 1 },
				{ name: "users_name_idx" }
			),
			this.tryCreateIndex(
				db.collection("users"),
				{ Email: 1 },
				{ name: "users_email_idx" }
			),
			this.tryCreateIndex(
				db.collection("failedAttempts"),
				{ UserId: 1 },
				{ name: "failed_attempts_user_id_idx", unique: true }
			),
			this.tryCreateIndex(
				db.collection("auditlogs"),
				{ timestamp: -1 },
				{ name: "auditlogs_timestamp_idx" }
			),
		]);
	}

	private async tryCreateIndex(
		collection: Collection,
		index: Document,
		options?: Document
	): Promise<void> {
		try {
			await collection.createIndex(index as any, options as any);
		} catch (error) {
			console.warn(
				`Unable to create index on collection ${collection.collectionName}.`,
				error
			);
		}
	}

	public async createCollection(collectionName: string): Promise<Collection> {
		const db = await this.getDb();
		const collection = await db.createCollection(collectionName);
		return collection;
	}

	public async dropCollection(collectionName: string): Promise<boolean> {
		const db = await this.getDb();
		const exists = await db
			.listCollections({ name: collectionName })
			.hasNext();
		if (!exists) {
			return false;
		}
		const result = await db.dropCollection(collectionName);
		return result;
	}

	public async createDocument<T>(
		collectionName: string,
		document: T,
		userId?: string // optional: for the audit log
	): Promise<boolean> {
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		const result = await collection.insertOne(document!);

		// Audit log for create
		if (collectionName !== "auditlogs") {
			const auditLog = new AuditLogModel({
				operation: "create",
				collection: collectionName,
				documentId:
					(document as any).Id || (document as any)._id || "unknown",
				timestamp: new Date(),
				userId,
				newValue: this.sanitizeForAuditLog(document),
			});
			await db.collection("auditlogs").insertOne(auditLog);
		}
		return result.acknowledged;
	}

	/**
	 * Removes sensitive data from objects for audit logs
	 */
	private sanitizeForAuditLog<T>(obj: T): Partial<T> {
		if (!obj || typeof obj !== "object") return obj;

		const sensitiveFields = [
			"Password",
			"password",
			"SessionID",
			"sessionID",
			"sessionId",
			"SessionCreatedAt",
			"sessionCreatedAt",
		];
		const sanitized = { ...obj } as any;

		for (const field of sensitiveFields) {
			if (field in sanitized) {
				sanitized[field] = "[REDACTED]";
			}
		}

		return sanitized as Partial<T>;
	}

	public async findDocument<T extends IModel>(
		collectionName: string,
		id: string
	): Promise<T | undefined> {
		const document = await this.findOneByQuery<T>(collectionName, {
			Id: id,
		});
		return document ?? undefined;
	}

	public async findOneByQuery<T>(
		collectionName: string,
		filter: Filter<Document>
	): Promise<T | null> {
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		return (await collection.findOne(filter)) as T | null;
	}

	public async updateDocument<T>(
		collectionName: string,
		filter: Filter<Document>,
		update: T extends IModel ? Partial<T> : Partial<Document>,
		userId?: string
	): Promise<boolean> {
		// The audit-log collection is read-only: updates/deletes are not allowed
		if (collectionName === "auditlogs") {
			throw new Error(
				"The audit-log collection is read-only and cannot be modified."
			);
		}
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		const oldDoc = await collection.findOne(filter);
		const result = await collection.updateOne(filter, {
			$set: update,
		});
		if (collectionName !== "auditlogs" && oldDoc) {
			const auditLog = new AuditLogModel({
				operation: "update",
				collection: collectionName,
				documentId: oldDoc.Id || oldDoc._id || "unknown",
				timestamp: new Date(),
				userId,
				oldValue: this.sanitizeForAuditLog(oldDoc),
				newValue: this.sanitizeForAuditLog({ ...oldDoc, ...update }),
			});
			await db.collection("auditlogs").insertOne(auditLog);
		}
		return result.acknowledged;
	}

	public async deleteDocument(
		collectionName: string,
		filter: Filter<Document>,
		userId?: string
	): Promise<boolean> {
		// The audit-log collection is read-only: updates/deletes are not allowed
		if (collectionName === "auditlogs") {
			throw new Error(
				"The audit-log collection is read-only and cannot be modified."
			);
		}
		try {
			const db = await this.getDb();
			const collection = db.collection(collectionName);
			const oldDoc = await collection.findOne(filter);
			const result = await collection.deleteOne(filter);
			if (collectionName !== "auditlogs" && oldDoc) {
				const auditLog = new AuditLogModel({
					operation: "delete",
					collection: collectionName,
					documentId: oldDoc.Id || oldDoc._id || "unknown",
					timestamp: new Date(),
					userId,
					oldValue: this.sanitizeForAuditLog(oldDoc),
				});
				await db.collection("auditlogs").insertOne(auditLog);
			}
			if (result.deletedCount > 0) {
				return true;
			} else {
				throw new Error("Document not found or could not be deleted.");
			}
		} catch (error) {
			console.error("Error deleting document:", error);
			throw error;
		}
	}

	public async updateDocumentWithOperators(
		collectionName: string,
		filter: Filter<Document>,
		update: UpdateFilter<Document>,
		options?: UpdateOptions
	): Promise<boolean> {
		if (collectionName === "auditlogs") {
			throw new Error(
				"The audit-log collection is read-only and cannot be modified."
			);
		}

		const db = await this.getDb();
		const collection = db.collection(collectionName);
		const result = await collection.updateOne(filter, update, options);
		return result.acknowledged;
	}

	public async listAllCollections(): Promise<string[]> {
		const db = await this.getDb();
		const collections = await db.listCollections().toArray();
		return collections.map((collection) => collection.name);
	}

	public async listAllDatabases(): Promise<string[]> {
		const db = await this.getDb();
		const databases = await db.admin().listDatabases();
		return databases.databases.map((database) => database.name);
	}

	public async listAllDocuments<T>(collectionName: string): Promise<T[]> {
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		const documents = await collection.find().toArray();
		return documents as T[];
	}

	public async listDocumentsPage<T>(
		collectionName: string,
		page: number,
		pageSize: number,
		filter: Filter<Document> = {}
	): Promise<T[]> {
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		const normalizedPage = page > 0 ? page : 1;
		const normalizedPageSize = pageSize > 0 ? pageSize : 10;

		return (await collection
			.find(filter)
			.skip((normalizedPage - 1) * normalizedPageSize)
			.limit(normalizedPageSize)
			.toArray()) as T[];
	}

	public async countDocuments(
		collectionName: string,
		filter: Filter<Document> = {}
	): Promise<number> {
		const db = await this.getDb();
		const collection = db.collection(collectionName);
		return collection.countDocuments(filter);
	}

	public async getDocumentByQuery<T>(
		_collectionName: string,
		arg1: { [key: string]: any }
	) {
		const db = await this.getDb();
		const collection = db.collection(_collectionName);
		const documents = await collection.find(arg1).toArray();
		return documents as T[];
	}

	public async getUserByUsername(username: string): Promise<User | null> {
		const db = await this.getDb();
		const collection = db.collection("users");
		const user = await collection.findOne<User>({ Name: username });
		return user;
	}

	public async getUserById(id: string): Promise<User | null> {
		const db = await this.getDb();
		const collection = db.collection("users");
		const user = await collection.findOne<User>({ Id: id });
		return user;
	}

	public async getUserByEmail(email: string): Promise<User | null> {
		const db = await this.getDb();
		const collection = db.collection("users");
		const user = await collection.findOne<User>({ Email: email });
		return user;
	}

	public async addUser(user: User): Promise<boolean> {
		const db = await this.getDb();
		const collection = db.collection("users");
		const result = await collection.insertOne(user);
		return result.acknowledged;
	}

	public async closeConnection(): Promise<void> {
		if (this.#client) {
			await this.#client.close();
		}
		this.resetConnectionState();
	}
}
