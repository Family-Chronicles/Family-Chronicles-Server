import { IModel } from "../interfaces/model.interface";

/**
 * Failed attempt model
 * @class
 * @implements {IModel}
 * @property {string} id - User id
 * @property {string} userId - User id
 * @property {number} attempts - Failed attempts
 * @property {Date} lastAttempt - Last failed attempt
 * @property {string[]} failedIPs - Failed IPs
 * @constructor
 * @param {string | null | undefined} id - User id
 * @param {string} userId - User id
 * @param {number} attempts - Failed attempts
 * @param {Date} lastAttempt - Last failed attempt
 * @param {string[]} failedIPs - Failed IPs
 * @returns {FailedAttemptModel} - Failed attempt model instance
 * @example
 * const failedAttempt = new FailedAttemptModel(
 * 	null,
 * 	"userId",
 * 	0,
 * 	new Date(),
 * 	["124214124"]
 * )
 */
export default class FailedAttemptModel implements IModel {
	// Properties
	public readonly Id: string;
	public UserId: string;
	public Attempts: number;
	public LastAttempt: Date;
	public FailedIPs: string[];

	// Constructor
	constructor(
		id: string | null | undefined,
		userId: string,
		attempts: number,
		lastAttempt: Date,
		failedIPs: string[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.Id = userId;
		} else {
			this.Id = id;
		}
		this.UserId = userId;
		this.Attempts = attempts;
		this.LastAttempt = lastAttempt;
		this.FailedIPs = failedIPs;
	}
}
