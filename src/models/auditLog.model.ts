import { ObjectId } from "mongodb";

/**
 * Audit Log Model
 * Stores immutable logs for all database operations (create, update, delete)
 */
export default class AuditLogModel {
	/**
	 * Unique ID of the log entry
	 */
	public _id?: ObjectId;

	/**
	 * Type of operation (create, update, delete)
	 */
	public operation: "create" | "update" | "delete";

	/**
	 * Name of the collection
	 */
	public collection: string;

	/**
	 * ID of the affected document
	 */
	public documentId: string;

	/**
	 * Timestamp of the operation
	 */
	public timestamp: Date;

	/**
	 * User (if available)
	 */
	public userId?: string;

	/**
	 * Previous value (for update/delete)
	 */
	public oldValue?: any;

	/**
	 * New value (for create/update)
	 */
	public newValue?: any;

	constructor(params: {
		operation: "create" | "update" | "delete";
		collection: string;
		documentId: string;
		timestamp?: Date;
		userId?: string;
		oldValue?: any;
		newValue?: any;
	}) {
		this.operation = params.operation;
		this.collection = params.collection;
		this.documentId = params.documentId;
		this.timestamp = params.timestamp || new Date();
		this.userId = params.userId;
		this.oldValue = params.oldValue;
		this.newValue = params.newValue;
	}
}
