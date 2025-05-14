import { Request, Response, Express } from "express";
import DatabaseService from "../services/database.srvs.js";
import AuthorizationService from "../services/auth.srvs.js";
import { RoleEnum } from "../enums/role.enum.js";

export class AuditLogController {
	private _database = DatabaseService.getInstance();
	private _authorization = AuthorizationService.getInstance();

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
	 * { "error": "Fehler beim Laden der Audit-Logs." }
	 */
	public routes(app: Express): void {
		app.get("/auditlogs", (req: Request, res: Response) => {
			this._authorization.requireRole(req, res, async () => {
				try {
					const { from, to } = req.query;
					let filter: any = {};
					if (from || to) {
						filter.timestamp = {};
						if (from) filter.timestamp.$gte = new Date(from as string);
						if (to) filter.timestamp.$lte = new Date(to as string);
					}
					const logs = await this._database.getDocumentByQuery("auditlogs", filter);
					res.status(200).json(logs);
				} catch (err) {
					res.status(500).json({ error: "Fehler beim Laden der Audit-Logs." });
				}
			}, [RoleEnum.ADMIN]);
		});
	}
}
