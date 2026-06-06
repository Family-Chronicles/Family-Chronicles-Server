import { Express, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { RoleEnum } from "../enums/role.enum";
import ErrorResult from "../models/actionResults/error.result";
import AuthorizationService from "../services/auth.srvs";
import DatabaseService from "../services/database.srvs";

export class AuditLogController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();

	/**
	 * Validierungs-Middleware für Audit-Log-Query-Parameter
	 */
	private auditLogValidation = [
		query("from")
			.optional()
			.isISO8601()
			.withMessage("'from' must be a valid ISO 8601 date"),
		query("to")
			.optional()
			.isISO8601()
			.withMessage("'to' must be a valid ISO 8601 date"),
	];

	/**
	 * GET /auditlogs
	 * @tags auditlog
	 * @summary Gibt Audit-Logs zurück (nur für Admins)
	 * @security BearerAuth
	 * @param {string} [from] - Startzeitpunkt (ISO-String)
	 * @param {string} [to] - Endzeitpunkt (ISO-String)
	 * @return {array} 200 - Erfolgreiche Antwort mit Audit-Logs
	 * @example response - 200 - Erfolg
	 * [
	 *   {
	 *     "operation": "create",
	 *     "collection": "person",
	 *     "documentId": "123",
	 *     "timestamp": "2024-01-01T12:00:00.000Z",
	 *     "userId": "admin",
	 *     "oldValue": null,
	 *     "newValue": {"name": "Max"}
	 *   }
	 * ]
	 * @example response - 401 - Nicht autorisiert
	 * { "status": 401 }
	 * @example response - 403 - Nicht berechtigt
	 * { "status": 403 }
	 * @example response - 500 - Serverfehler
	 * { "error": "Failed to load audit logs." }
	 */
	public routes(app: Express): void {
		app.get(
			"/auditlogs",
			this.auditLogValidation,
			(req: Request, res: Response) => {
				// Input-Validierung prüfen
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.status(400).send(
						new ErrorResult(
							400,
							errors
								.array()
								.map((e) => e.msg)
								.join(", ")
						)
					);
					return;
				}

				this._authorization.requireRole(
					req,
					res,
					async () => {
						try {
							const { from, to } = req.query;
							let filter: Record<
								string,
								{ $gte?: Date; $lte?: Date }
							> = {};
							if (from || to) {
								filter.timestamp = {};
								if (from)
									filter.timestamp.$gte = new Date(
										from as string
									);
								if (to)
									filter.timestamp.$lte = new Date(
										to as string
									);
							}
							const logs =
								await this._database.getDocumentByQuery(
									"auditlogs",
									filter
								);
							res.status(200).json(logs);
						} catch (err) {
							console.error("AuditLog fetch error:", err);
							res.status(500).json({
								error: "Failed to load audit logs.",
							});
						}
					},
					[RoleEnum.ADMIN]
				);
			}
		);
	}
}
