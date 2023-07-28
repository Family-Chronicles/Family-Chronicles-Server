import { IActionResult } from "../../interfaces/actionResult.interface";

/**
 * Ok result
 * @export
 * @class Ok
 * @implements {IActionResult}
 * @property {number} status - Status code
 * @property {string} [message] - Message
 *
 * @example
 * const okResult = new Ok("OK");
 * const okResult = new Ok();
 */
export class Ok implements IActionResult {
	public readonly status: number = 200;

	constructor(public readonly message?: string) {
		if (message) {
			this.message = message;
		} else {
			this.message = "OK";
		}
	}
}
