import { Config } from "../types/config.type.js";
import { MongoClient, Collection, Db, MongoClientOptions } from "mongodb";
import { ConfigService } from "./config.srvs.js";
import { IModel } from "../interfaces/model.interface.js";

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
export class DatabaseService {
	private static instance: DatabaseService;
	private config: Config = ConfigService.getInstance()._config;
	private client: MongoClient | undefined;
	private db: Db | undefined;

	private constructor() {}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
			DatabaseService.instance.intializeDatabase();
		}

		return DatabaseService.instance;
	}

	private async intializeDatabase(): Promise<void> {
		await this.connect(
			this.config.database.host,
			this.config.database.databasename
		);
		const collections = await this.db!.listCollections().toArray();
		const collectionNames = collections.map((collection) => collection.name);
		const configCollections = this.config.database.collections;
		configCollections.forEach(async (collection) => {
			if (!collectionNames.includes(collection)) {
				await this.db!.createCollection(collection);
			}
		});
		this.setListener();
	}

	private async connect(uri: string, dbName: string): Promise<void> {
		this.client = await MongoClient.connect(uri, <MongoClientOptions>{
			useUnifiedTopology: true,
			auth: {
				username: this.config.database.username,
				password: this.config.database.password,
			},
			appName: this.config.meta.name,
		});
		this.db = this.client.db(dbName);
	}

	private async setListener(): Promise<void> {
		this.client!.on("close", async () => {
			console.log("MongoDB connection closed.");
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			);
		});
		this.client!.on("reconnect", async () => {
			console.log("MongoDB connection reconnected.");
		});
		this.client!.on("timeout", async () => {
			console.log("MongoDB connection timeout.");
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			);
		});
		this.client!.on("error", async (error) => {
			console.log("MongoDB connection error: " + error);
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			);
		});
	}

	public async createCollection(collectionName: string): Promise<Collection> {
		const collection = await this.db!.createCollection(collectionName);
		return collection;
	}

	public async dropCollection(collectionName: string): Promise<boolean> {
		const result = await this.db!.dropCollection(collectionName);
		return result;
	}

	public async createDocument<T>(
		collectionName: string,
		document: T
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.insertOne(document!);
		return result.acknowledged;
	}

	public async findDocument<T extends IModel>(
		_collectionName: string,
		id: string
	): Promise<T | undefined> {
		const document = await this.listAllDocuments<T>(_collectionName).then(
			(documents) => {
				return documents.find((document) => document.id === id);
			}
		);
		return document;
	}

	public async updateDocument(
		collectionName: string,
		filter: any,
		update: any
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.updateOne(filter, { $set: update });
		return result.acknowledged;
	}

	public async deleteDocument(
		collectionName: string,
		filter: any
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.deleteOne(filter);
		return result.acknowledged;
	}

	public async listAllCollections(): Promise<string[]> {
		const collections = await this.db!.listCollections().toArray();
		return collections.map((collection) => collection.name);
	}

	public async listAllDatabases(): Promise<string[]> {
		const databases = await this.db!.admin().listDatabases();
		return databases.databases.map((database) => database.name);
	}

	public async listAllDocuments<T>(collectionName: string): Promise<T[]> {
		const collection = this.db!.collection(collectionName);
		const documents = await collection.find().toArray();
		return documents as T[];
	}
}
