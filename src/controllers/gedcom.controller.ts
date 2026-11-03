import { Router } from "express";
import multer from "multer";
import express from "express";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError } from "../core/http.core.js";
import { decodeGedcom, GedcomError } from "../gedcom/parser.js";
import { importGedcom } from "../gedcom/importer.js";
import { exportGedcom } from "../gedcom/exporter.js";
import {
	extensionOf,
	isZip,
	MIME_BY_EXTENSION,
	readGedZip,
	writeZip,
} from "../gedcom/zip.js";

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
		type: [
			"text/*",
			"application/octet-stream",
			"application/x-gedcom",
			"application/zip",
		],
		limit: `${MAX_GEDCOM_MB}mb`,
	});

	/**
	 * POST /api/v1/gedcom/import
	 * @tags gedcom
	 * @summary Import a GEDCOM 5.5.1 file or a GEDZIP (zip with the .ged file and media files) (Editor). Send the file as multipart field "file" or as raw body. Data is added, never merged or overwritten.
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
			try {
				const zip = isZip(data) ? readGedZip(data) : null;
				const { text, warnings } = decodeGedcom(
					zip ? Buffer.from(zip.gedcom) : data
				);
				const result = await importGedcom(text, ctx.repos, {
					familyName:
						typeof req.query.family === "string"
							? req.query.family
							: undefined,
					files: zip?.files,
					storage: ctx.storage,
					userId: req.user!.Id,
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
	 * @summary Export all persons and relationships as GEDCOM 5.5.1 (Editor). With format=zip as GEDZIP including the media files.
	 * @param {string} format.query - "zip" for a GEDZIP with media files
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
			const date = new Date().toISOString().slice(0, 10);
			if (req.query.format === "zip") {
				const files: Record<string, Uint8Array> = {};
				const byPerson = new Map<
					string,
					{ path: string; title: string }[]
				>();
				for (const item of await ctx.repos.media.findAll()) {
					let data: Buffer | null = null;
					let ext = extensionOf(item.FileName ?? "");
					if (item.StorageKey) {
						data = await ctx.storage
							.read(item.StorageKey)
							.catch(() => null);
					} else if (item.Content) {
						data = Buffer.from(item.Content, "utf8");
						ext = "txt";
					}
					if (!data) continue;
					if (!MIME_BY_EXTENSION[ext]) ext = ext || "bin";
					const path = `media/${item.Id}.${ext}`;
					files[path] = new Uint8Array(data);
					byPerson.set(item.PersonId, [
						...(byPerson.get(item.PersonId) ?? []),
						{ path, title: item.Title },
					]);
				}
				const gedcom = exportGedcom(
					persons,
					relationships,
					ctx.config.meta,
					byPerson
				);
				files["family-chronicles.ged"] = new TextEncoder().encode(
					gedcom
				);
				res.setHeader("Content-Type", "application/zip");
				res.setHeader(
					"Content-Disposition",
					`attachment; filename="family-chronicles-${date}.zip"`
				);
				res.send(Buffer.from(writeZip(files)));
				return;
			}
			const gedcom = exportGedcom(
				persons,
				relationships,
				ctx.config.meta
			);
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
