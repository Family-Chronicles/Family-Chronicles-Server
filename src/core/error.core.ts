import * as util from "util";
import DatabaseService from "../services/database.srvs.js";
import ErrorModel from "../models/error.model.js";

export default class GlobalErrorHandler {
	private _database: DatabaseService;
	private _collectionName: string = "errors";

	constructor() {
		this._database = DatabaseService.getInstance();
		this.initDatabase();

		process.on("uncaughtException", (error: Error) => {
			console.error("Uncaught Exception:");
			console.error(util.inspect(error, false, null, true));
			this.logErrorToDatabase(error).catch(() => {
				console.error("Failed to log error to the database");
			});
			process.exit(1);
		});

		process.on(
			"unhandledRejection",
			(reason: any, promise: Promise<any>) => {
				console.error("Unhandled Promise Rejection:");
				console.error("Promise:", promise);
				console.error(
					"Reason:",
					util.inspect(reason, false, null, true)
				);
				this.logRejectionToDatabase(reason, promise).catch(() => {
					console.error("Failed to log rejection to the database");
				});
				process.exit(1);
			}
		);
	}

	private async logErrorToDatabase(error: Error): Promise<void> {
		const errorDocument = new ErrorModel(
			error.name,
			error.message,
			error.stack!,
			new Date()
		);
		await this._database.createDocument(
			this._collectionName,
			errorDocument
		);
	}

	private async logRejectionToDatabase(
		reason: any,
		promise: Promise<any>
	): Promise<void> {
		const errorDocument = new ErrorModel(
			"Unhandled Promise Rejection",
			reason,
			promise.toString(),
			new Date()
		);
		await this._database.createDocument(
			this._collectionName,
			errorDocument
		);
	}

	private async initDatabase(): Promise<void> {
		try {
			await this._database.createCollection(this._collectionName);
			console.log(
				`Collection '${this._collectionName}' created successfully.`
			);
		} catch (error: any) {
			console.log(
				`Failed to create collection '${this._collectionName}': ${error.message}`
			);
		}
	}
}
