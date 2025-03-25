import { Config } from "../types/config.type.js";
import {
	MongoClient,
	Collection,
	Db,
	MongoClientOptions,
	Filter,
	Document,
} from "mongodb";
import ConfigService from "./config.srvs.js";
import { IModel } from "../interfaces/model.interface.js";
import User from "../models/user.model.js";

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
		document: T
	): Promise<boolean> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection(collectionName);
		const result = await collection.insertOne(document!);
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
		update: T extends IModel ? Partial<T> : Partial<Document>
	): Promise<boolean> {
		const db = await this.connect(
			this.#config.database.host,
			this.#config.database.databasename
		);
		const collection = db.collection(collectionName);
		const result = await collection.updateOne(filter, {
			$set: update,
		});
		return result.acknowledged;
	}

	public async deleteDocument(
		collectionName: string,
		filter: Filter<Document>
	): Promise<boolean> {
		try {
			const db = await this.connect(
				this.#config.database.host,
				this.#config.database.databasename
			);
			const collection = db.collection(collectionName);

			const result = await collection.deleteOne(filter);
			return result.deletedCount > 0;
		} catch (error) {
			console.error("Error deleting document:", error);
			return false;
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
		const user = await collection.findOne<User>({ username });
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
