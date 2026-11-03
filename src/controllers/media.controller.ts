import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import { AppContext } from "../core/context.core.js";
import { handle, HttpError, notFound, now, parse } from "../core/http.core.js";
import { Media, MediaTag, MediaType } from "../models/media.model.js";
import { GenealogyService } from "../services/genealogy.srvs.js";
import { mediaSchema, patchSchema, tagSchema } from "../validation/schemas.js";

function typeFromMime(mime: string | null): MediaType {
	if (!mime) return "Text";
	if (mime.startsWith("image/")) return "Image";
	if (mime.startsWith("video/")) return "Video";
	if (mime.startsWith("audio/")) return "Audio";
	if (mime.startsWith("text/")) return "Text";
	if (mime === "application/pdf" || mime.includes("document"))
		return "Document";
	return "Other";
}

/** Pictures, videos, texts, ... of persons, and person tags on them */
export function mediaController(
	ctx: AppContext,
	genealogy: GenealogyService
): Router {
	const router = Router();
	const { media, tags, persons } = ctx.repos;
	const read = ctx.auth.require("Viewer");
	const write = ctx.auth.require("Editor");
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: ctx.config.server.maxUploadMb * 1024 * 1024 },
	});

	const load = async (id: string) => {
		const item = await media.findById(id);
		if (!item) throw notFound("Media");
		return item;
	};

	/**
	 * GET /api/v1/media
	 * @tags media
	 * @summary Media, optionally of one person
	 * @security BearerAuth
	 * @param {string} personId.query - owner person id
	 * @return {array<object>} 200 - media
	 */
	router.get(
		"/",
		read,
		handle(async (req, res) => {
			const filter: Partial<Media> = {};
			if (typeof req.query.personId === "string")
				filter.PersonId = req.query.personId;
			const items = await media.findAll(filter);
			items.sort((a, b) => b.CreatedAt.localeCompare(a.CreatedAt));
			res.send(items);
		})
	);

	/**
	 * GET /api/v1/media/{id}
	 * @tags media
	 * @summary Metadata of a media item including its tags
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @return {object} 200 - media
	 */
	router.get(
		"/:id",
		read,
		handle(async (req, res) => {
			const item = await load(req.params.id);
			res.send({
				...item,
				Tags: await tags.findAll({ MediaId: item.Id }),
			});
		})
	);

	/**
	 * GET /api/v1/media/{id}/file
	 * @tags media
	 * @summary Download the file of a media item
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @return {string} 200 - file content
	 */
	router.get(
		"/:id/file",
		read,
		handle(async (req, res) => {
			const item = await load(req.params.id);
			if (!item.StorageKey) throw notFound("File");
			const data = await ctx.storage.read(item.StorageKey);
			res.setHeader(
				"Content-Type",
				item.MimeType ?? "application/octet-stream"
			);
			res.setHeader(
				"Content-Disposition",
				`inline; filename*=UTF-8''${encodeURIComponent(
					item.FileName ?? item.Id
				)}`
			);
			res.setHeader("X-Content-Type-Options", "nosniff");
			res.send(data);
		})
	);

	/**
	 * POST /api/v1/media
	 * @tags media
	 * @summary Create a media item (Editor). multipart/form-data with field "file", or JSON with "Content" for text.
	 * @security BearerAuth
	 * @param {object} request.body.required - { PersonId, Title, Description, Type, Content }
	 * @return {object} 201 - media
	 */
	router.post(
		"/",
		write,
		upload.single("file"),
		handle(async (req, res) => {
			const body = parse(mediaSchema, req.body);
			if (!(await persons.findById(body.PersonId)))
				throw notFound("Person");
			const file = req.file;
			if (!file && !body.Content) {
				throw new HttpError(
					400,
					"Either a file or Content is required"
				);
			}
			const item: Media = {
				Id: crypto.randomUUID(),
				PersonId: body.PersonId,
				Title: body.Title,
				Description: body.Description,
				Type: body.Type ?? typeFromMime(file?.mimetype ?? null),
				Content: body.Content,
				FileName: file?.originalname ?? null,
				MimeType: file?.mimetype ?? null,
				Size: file?.size ?? null,
				StorageKey: file ? await ctx.storage.save(file.buffer) : null,
				CreatedBy: req.user!.Id,
				CreatedAt: now(),
				UpdatedAt: now(),
			};
			await media.create(item);
			res.status(201).send(item);
		})
	);

	/**
	 * PUT /api/v1/media/{id}
	 * @tags media
	 * @summary Update title, description, type, owner or text content (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @return {object} 200 - media
	 */
	router.put(
		"/:id",
		write,
		handle(async (req, res) => {
			const item = await load(req.params.id);
			const patch = parse(patchSchema(mediaSchema), req.body);
			if (patch.PersonId && !(await persons.findById(patch.PersonId))) {
				throw notFound("Person");
			}
			res.send(
				await media.update(item.Id, { ...patch, UpdatedAt: now() })
			);
		})
	);

	/**
	 * DELETE /api/v1/media/{id}
	 * @tags media
	 * @summary Delete a media item, its file and tags (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id",
		write,
		handle(async (req, res) => {
			if (!(await genealogy.deleteMedia(req.params.id)))
				throw notFound("Media");
			res.send({ success: true });
		})
	);

	/**
	 * GET /api/v1/media/{id}/tags
	 * @tags media
	 * @summary Persons tagged on a media item
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @return {array<object>} 200 - tags
	 */
	router.get(
		"/:id/tags",
		read,
		handle(async (req, res) => {
			const item = await load(req.params.id);
			res.send(await tags.findAll({ MediaId: item.Id }));
		})
	);

	/**
	 * POST /api/v1/media/{id}/tags
	 * @tags media
	 * @summary Tag a person on a media item (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @param {object} request.body.required - { PersonId, X, Y, Notes }
	 * @return {object} 201 - tag
	 */
	router.post(
		"/:id/tags",
		write,
		handle(async (req, res) => {
			const item = await load(req.params.id);
			const body = parse(tagSchema, req.body);
			if (!(await persons.findById(body.PersonId)))
				throw notFound("Person");
			if (
				await tags.findOne({
					MediaId: item.Id,
					PersonId: body.PersonId,
				})
			) {
				throw new HttpError(409, "Person is already tagged");
			}
			const tag: MediaTag = {
				Id: crypto.randomUUID(),
				MediaId: item.Id,
				...body,
			};
			await tags.create(tag);
			res.status(201).send(tag);
		})
	);

	/**
	 * DELETE /api/v1/media/{id}/tags/{tagId}
	 * @tags media
	 * @summary Remove a tag (Editor)
	 * @security BearerAuth
	 * @param {string} id.path.required - media id
	 * @param {string} tagId.path.required - tag id
	 * @return {object} 200 - success
	 */
	router.delete(
		"/:id/tags/:tagId",
		write,
		handle(async (req, res) => {
			const tag = await tags.findById(req.params.tagId);
			if (!tag || tag.MediaId !== req.params.id) throw notFound("Tag");
			await tags.delete(tag.Id);
			res.send({ success: true });
		})
	);

	return router;
}
