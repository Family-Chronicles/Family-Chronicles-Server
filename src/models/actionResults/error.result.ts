import { IActionResult } from "../../interfaces/actionResult.interface.js";

/**
 * ErrorResult
 * @export
 * @class ErrorResult
 * @implements {IActionResult}
 * @property {number} status - Status code
 * @property {string} [message] - Message
 *
 * @example
 * const errorResult = new ErrorResult(500, "Internal server error");
 */
export default class ErrorResult implements IActionResult {
	constructor(
		public readonly status: number,
		public readonly message?: string
	) {
		this.status = status;
		if (message) {
			this.message = message;
		} else {
			switch (status) {
				case 400:
					this.message = "Bad request";
					break;
				case 401:
					this.message = "Unauthorized";
					break;
				case 403:
					this.message = "Forbidden";
					break;
				case 404:
					this.message = "Not found";
					break;
				case 405:
					this.message = "Method not allowed";
					break;
				case 406:
					this.message = "Not acceptable";
					break;
				case 408:
					this.message = "Request timeout";
					break;
				case 500:
					this.message = "Internal server error";
					break;
				case 501:
					this.message = "Not implemented";
					break;
				case 502:
					this.message = "Bad gateway";
					break;
				case 503:
					this.message = "Service unavailable";
					break;
				case 504:
					this.message = "Gateway timeout";
					break;
				default:
					this.message = "Unexpected error";
					break;
			}
		}
	}
}
