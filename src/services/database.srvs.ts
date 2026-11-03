import { MongoClient } from "mongodb";
import { Config } from "../types/config.type.js";
import { Family, FamilyMembership } from "../models/family.model.js";
import { Media, MediaTag } from "../models/media.model.js";
import { Person } from "../models/person.model.js";
import { Relationship } from "../models/relationship.model.js";
import { User } from "../models/user.model.js";
import { IRepository } from "../repositories/repository.interface.js";
import { MemoryRepository } from "../repositories/memory.repository.js";
import { MongoRepository } from "../repositories/mongo.repository.js";

export interface Repositories {
	users: IRepository<User>;
	persons: IRepository<Person>;
	families: IRepository<Family>;
	memberships: IRepository<FamilyMembership>;
	relationships: IRepository<Relationship>;
	media: IRepository<Media>;
	tags: IRepository<MediaTag>;
}

const COLLECTIONS: Record<keyof Repositories, string> = {
	users: "users",
	persons: "persons",
	families: "familys",
	memberships: "memberships",
	relationships: "relationships",
	media: "media",
	tags: "tags",
};

export interface Database {
	repositories: Repositories;
	close(): Promise<void>;
}

export function createMemoryDatabase(): Database {
	const repositories = Object.fromEntries(
		Object.keys(COLLECTIONS).map((key) => [key, new MemoryRepository()])
	) as unknown as Repositories;
	return { repositories, close: async () => undefined };
}

/**
 * Opens one shared MongoDB connection and creates a repository per collection.
 */
export async function createMongoDatabase(
	config: Config["database"]
): Promise<Database> {
	const client = await MongoClient.connect(config.host, {
		auth: config.username
			? { username: config.username, password: config.password }
			: undefined,
		appName: "family-chronicles-server",
	});
	const db = client.db(config.databasename);

	const repositories = {} as Record<string, MongoRepository<never>>;
	for (const [key, name] of Object.entries(COLLECTIONS)) {
		const repo = new MongoRepository<never>(db, name);
		await repo.ensureIndexes();
		repositories[key] = repo;
	}

	return {
		repositories: repositories as unknown as Repositories,
		close: () => client.close(),
	};
}

export function createDatabase(config: Config["database"]): Promise<Database> {
	return config.driver === "memory"
		? Promise.resolve(createMemoryDatabase())
		: createMongoDatabase(config);
}
