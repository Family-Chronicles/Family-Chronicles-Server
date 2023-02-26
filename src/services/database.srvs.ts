import { Config } from "../types/config.type.js";
import { MongoClient, Collection, Db, MongoClientOptions } from "mongodb";
import { ConfigService } from "./config.srvs.js";

export class DatabaseService {
	private static instance: DatabaseService;
	private config: Config = ConfigService.getInstance()._config;
	private client: MongoClient | undefined;
	private db: Db | undefined;

	private constructor() {}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}

		return DatabaseService.instance;
	}

	public async connect(uri: string, dbName: string): Promise<void> {
		this.client = await MongoClient.connect(uri, <MongoClientOptions>{
			useUnifiedTopology: true,
		});
		this.db = this.client.db(dbName);
	}

	public async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
		}
	}

	public async createCollection(collectionName: string): Promise<Collection> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const collection = await this.db!.createCollection(collectionName);
		return collection;
	}

	public async dropCollection(collectionName: string): Promise<boolean> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const result = await this.db!.dropCollection(collectionName);
		return result;
	}

	public async insertDocument(
		collectionName: string,
		document: any
	): Promise<boolean> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const collection = this.db!.collection(collectionName);
		const result = await collection.insertOne(document);
		return result.acknowledged;
	}

	public async updateDocument(
		collectionName: string,
		filter: any,
		update: any
	): Promise<boolean> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const collection = this.db!.collection(collectionName);
		const result = await collection.updateOne(filter, { $set: update });
		return result.acknowledged;
	}

	public async deleteDocument(
		collectionName: string,
		filter: any
	): Promise<boolean> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const collection = this.db!.collection(collectionName);
		const result = await collection.deleteOne(filter);
		return result.acknowledged;
	}

	public async listAllCollections(): Promise<string[]> {
		if (!this.client || !this.db) {
			await this.connect(
				this.config.database.host,
				this.config.database.databasename
			)
		}
		const collections = await this.db!.listCollections().toArray();
		return collections.map((collection) => collection.name);
	}
}
