import { Router } from "express";
import multer from "multer";
import express from "express";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError } from "../core/http.core.js";
import { decodeGedcom, GedcomError } from "../gedcom/parser.js";
import { importGedcom } from "../gedcom/importer.js";
import { exportGedcom } from "../gedcom/exporter.js";

const MAX_GEDCOM_MB = 50;

/** Import and export of GEDCOM 5.5.1 files (Editor) */
export function gedcomController(ctx: AppContext): Router {
	const router = Router();
	router.use(ctx.auth.require("Editor"));

	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: MAX_GEDCOM_MB * 1024 * 1024 },
	});
	const rawText = express.raw({
		type: ["text/*", "application/octet-stream", "application/x-gedcom"],
		limit: `${MAX_GEDCOM_MB}mb`,
	});

	/**
	 * POST /api/v1/gedcom/import
	 * @tags gedcom
	 * @summary Import a GEDCOM 5.5.1 file (Editor). Send the file as multipart field "file" or as raw body (text/plain). Data is added, never merged or overwritten.
	 * @security BearerAuth
	 * @param {string} family.query - optional: create a family with this name containing all imported persons
	 * @return {object} 201 - { Persons, Relationships, FamilyId, Warnings }
	 * @return {object} 400 - invalid GEDCOM, with line number
	 */
	router.post(
		"/import",
		upload.single("file"),
		rawText,
		handle(async (req, res) => {
			const data: Buffer | undefined =
				req.file?.buffer ??
				(Buffer.isBuffer(req.body) ? req.body : undefined);
			if (!data || data.length === 0) {
				throw new HttpError(400, "No GEDCOM data received");
			}
			const { text, warnings } = decodeGedcom(data);
			try {
				const result = await importGedcom(text, ctx.repos, {
					familyName:
						typeof req.query.family === "string"
							? req.query.family
							: undefined,
				});
				result.Warnings.unshift(...warnings);
				res.status(201).send(result);
			} catch (error) {
				if (error instanceof GedcomError) {
					throw new HttpError(
						400,
						`Invalid GEDCOM: ${error.message}`
					);
				}
				throw error;
			}
		})
	);

	/**
	 * GET /api/v1/gedcom/export
	 * @tags gedcom
	 * @summary Export all persons and relationships as GEDCOM 5.5.1 (Editor)
	 * @security BearerAuth
	 * @return {string} 200 - GEDCOM file (text/plain, UTF-8)
	 */
	router.get(
		"/export",
		handle(async (req, res) => {
			const [persons, relationships] = await Promise.all([
				ctx.repos.persons.findAll(),
				ctx.repos.relationships.findAll(),
			]);
			const gedcom = exportGedcom(
				persons,
				relationships,
				ctx.config.meta
			);
			const date = new Date().toISOString().slice(0, 10);
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="family-chronicles-${date}.ged"`
			);
			res.send(gedcom);
		})
	);

	return router;
}
