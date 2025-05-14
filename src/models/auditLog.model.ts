import { ObjectId } from "mongodb";

/**
 * Audit Log Model
 * Speichert unveränderliche Logs zu allen Datenbankoperationen (Create, Update, Delete)
 */
export default class AuditLogModel {
	/**
	 * Eindeutige ID des Log-Eintrags
	 */
	public _id?: ObjectId;

	/**
	 * Typ der Operation (create, update, delete)
	 */
	public operation: "create" | "update" | "delete";

	/**
	 * Name der Collection
	 */
	public collection: string;

	/**
	 * ID des betroffenen Dokuments
	 */
	public documentId: string;

	/**
	 * Zeitstempel der Operation
	 */
	public timestamp: Date;

	/**
	 * Benutzer (sofern verfügbar)
	 */
	public userId?: string;

	/**
	 * Alter Wert (bei update/delete)
	 */
	public oldValue?: any;

	/**
	 * Neuer Wert (bei create/update)
	 */
	public newValue?: any;

	constructor(params: {
		operation: "create" | "update" | "delete",
		collection: string,
		documentId: string,
		timestamp?: Date,
		userId?: string,
		oldValue?: any,
		newValue?: any
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
