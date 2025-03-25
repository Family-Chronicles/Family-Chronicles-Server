import { IModel } from "../interfaces/model.interface.js";
import crypto from "crypto";

/**
 * Error model
 * @class ErrorModel
 * @implements {IModel}
 * @property {string} name - Error name
 * @property {string} message - Error message
 * @property {string} stack - Error stack
 * @property {Date} date - Error date
 * @constructor
 * @returns {ErrorModel} - Error model instance
 * @example
 * const errorModel = new ErrorModel("name", "message", "stack", new Date());
 * const errorModel = new ErrorModel(error.name, error.message, error.stack, new Date());
 * const errorModel = new ErrorModel(error.name, error.message, error.stack, error.date);
 */
export default class ErrorModel implements IModel {
	public readonly Id = crypto.randomUUID();
	public name: string;
	public message: string;
	public stack: string;
	public date: Date;

	constructor(name: string, message: string, stack: string, date: Date) {
		this.name = name;
		this.message = message;
		this.stack = stack;
		this.date = date;
	}
}
