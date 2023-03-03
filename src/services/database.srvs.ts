import { Config } from "../types/config.type";
import { MongoClient, Collection, Db, MongoClientOptions } from "mongodb";
import { ConfigService } from "./config.srvs";

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

	private async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
		}
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
		this.disconnect();
		return collection;
	}

	public async dropCollection(collectionName: string): Promise<boolean> {
		const result = await this.db!.dropCollection(collectionName);
		this.disconnect();
		return result;
	}

	public async insertDocument(
		collectionName: string,
		document: any
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.insertOne(document);
		this.disconnect();
		return result.acknowledged;
	}

	public async updateDocument(
		collectionName: string,
		filter: any,
		update: any
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.updateOne(filter, { $set: update });
		this.disconnect();
		return result.acknowledged;
	}

	public async deleteDocument(
		collectionName: string,
		filter: any
	): Promise<boolean> {
		const collection = this.db!.collection(collectionName);
		const result = await collection.deleteOne(filter);
		this.disconnect();
		return result.acknowledged;
	}

	public async listAllCollections(): Promise<string[]> {
		const collections = await this.db!.listCollections().toArray();
		this.disconnect();
		return collections.map((collection) => collection.name);
	}

	public async listAllDatabases(): Promise<string[]> {
		const databases = await this.db!.admin().listDatabases();
		this.disconnect();
		return databases.databases.map((database) => database.name);
	}
}
