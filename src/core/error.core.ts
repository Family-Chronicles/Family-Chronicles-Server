import * as util from "util";
import { DatabaseService } from "../services/database.srvs.js";
import { ErrorModel } from "../models/error.model.js";

export default class GlobalErrorHandler {
	private _database = DatabaseService.getInstance();
	private _collectionName = "errors";

	constructor() {
		this.initDatabase();

		process.on("uncaughtException", (error: Error) => {
			console.error("Uncaught Exception:");
			console.error(util.inspect(error, false, null, true));
			this.logErrorToDatabase(error);
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
				this.logRejectionToDatabase(reason, promise);
				process.exit(1);
			}
		);
	}

	private logErrorToDatabase(error: Error): void {
		const errorDocument = new ErrorModel(
			error.name,
			error.message,
			error.stack!,
			new Date()
		);
		this._database.createDocument(this._collectionName, errorDocument);
	}

	private logRejectionToDatabase(reason: any, promise: Promise<any>): void {
		const errorDocument = new ErrorModel(
			"Unhandled Promise Rejection",
			reason,
			promise.toString(),
			new Date()
		);
		this._database.createDocument(this._collectionName, errorDocument);
	}

	private initDatabase(): void {
		this._database
			.createCollection(this._collectionName)
			.then(() => {
				console.log(
					`Collection '${this._collectionName}' created successfully.`
				);
			})
			.catch((error) => {
				console.log(
					`Failed to create collection '${this._collectionName}': ${error.message}`
				);
			});
	}
}
