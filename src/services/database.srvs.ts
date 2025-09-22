import {
	Collection,
	Db,
	Document,
	Filter,
	MongoClient,
	MongoClientOptions,
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

	private constructor() {}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.#instance) {
			DatabaseService.#instance = new DatabaseService();
			DatabaseService.#instance.intializeDatabase();
		}

		return DatabaseService.#instance;
	}

	private async intializeDatabase(): Promise<void> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map(
			(collection) => collection.name
		);
		const configCollections = this.#config.database.collections;
		if (!configCollections.includes("auditlogs")) {
			configCollections.push("auditlogs");
		}
		configCollections.forEach(async (collection) => {
			if (!collectionNames.includes(collection)) {
				await db.createCollection(collection);
			}
		});
		this.setListener();
	}

	private async connect(uri: string, dbName: string): Promise<Db> {
		this.#client = await MongoClient.connect(uri, <MongoClientOptions>{
			useUnifiedTopology: true,
			auth: {
				username: this.#config.database.username,
				password: this.#config.database.password,
			},
			appName: this.#config.meta.name,
		});
		return this.#client.db(dbName);
	}

	private async setListener(): Promise<void> {
		this.#client!.on("close", async () => {
			console.log("MongoDB connection closed.");
			await this.connect(
				this.#config.database.host,
				this.#config.database.databasename
			);
		});
		this.#client!.on("reconnect", async () => {
			console.log("MongoDB connection reconnected.");
		});
		this.#client!.on("timeout", async () => {
			console.log("MongoDB connection timeout.");
			await this.connect(
				this.#config.database.host,
				this.#config.database.databasename
			);
		});
		this.#client!.on("error", async (error) => {
			console.log("MongoDB connection error: " + error);
			await this.connect(
				this.#config.database.host,
				this.#config.database.databasename
			);
		});
	}

	public async createCollection(collectionName: string): Promise<Collection> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = await db.createCollection(collectionName);
		return collection;
	}

	public async dropCollection(collectionName: string): Promise<boolean> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const result = await db.dropCollection(collectionName);
		return result;
	}

	public async createDocument<T>(
		collectionName: string,
		document: T,
		userId?: string // optional: für Audit-Log
	): Promise<boolean> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection(collectionName);
		const result = await collection.insertOne(document!);

		// Audit-Log für Create
		if (collectionName !== "auditlogs") {
			const auditLog = new AuditLogModel({
				operation: "create",
				collection: collectionName,
				documentId:
					(document as any).Id || (document as any)._id || "unknown",
				timestamp: new Date(),
				userId,
				newValue: document,
			});
			await db.collection("auditlogs").insertOne(auditLog);
		}
		return result.acknowledged;
	}

	public async findDocument<T extends IModel>(
		_collectionName: string,
		id: string
	): Promise<T | undefined> {
		const document = await this.listAllDocuments<T>(_collectionName).then(
			(documents) => {
				return documents.find((document) => document.Id === id);
			}
		);
		return document;
	}

	public async updateDocument<T>(
		collectionName: string,
		filter: Filter<Document>,
		update: T extends IModel ? Partial<T> : Partial<Document>,
		userId?: string
	): Promise<boolean> {
		// Audit-Log-Collection ist read-only: keine Updates/Löschungen zulassen
		if (collectionName === "auditlogs") {
			throw new Error(
				"Audit-Log-Collection ist read-only und kann nicht verändert werden."
			);
		}
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
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
				oldValue: oldDoc,
				newValue: { ...oldDoc, ...update },
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
		// Audit-Log-Collection ist read-only: keine Updates/Löschungen zulassen
		if (collectionName === "auditlogs") {
			throw new Error(
				"Audit-Log-Collection ist read-only und kann nicht verändert werden."
			);
		}
		try {
			const db = await this.connect(
				this.#config.database.host,
				this.#config.database.databasename
			);
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
					oldValue: oldDoc,
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

	public async listAllCollections(): Promise<string[]> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collections = await db.listCollections().toArray();
		return collections.map((collection) => collection.name);
	}

	public async listAllDatabases(): Promise<string[]> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const databases = await db.admin().listDatabases();
		return databases.databases.map((database) => database.name);
	}

	public async listAllDocuments<T>(collectionName: string): Promise<T[]> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection(collectionName);
		const documents = await collection.find().toArray();
		return documents as T[];
	}

	public async getDocumentByQuery<T>(
		_collectionName: string,
		arg1: { [key: string]: any }
	) {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection(_collectionName);
		const documents = await collection.find(arg1).toArray();
		return documents as T[];
	}

	public async getUserByUsername(username: string): Promise<User | null> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection("users");
	const user = await collection.findOne<User>({ Name: username });
		return user;
	}

	public async getUserById(id: string): Promise<User | null> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection("users");
		const user = await collection.findOne<User>({ Id: id });
		return user;
	}

	public async addUser(user: User): Promise<boolean> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection("users");
		const result = await collection.insertOne(user);
		return result.acknowledged;
	}
}
