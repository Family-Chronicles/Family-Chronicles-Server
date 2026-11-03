import { unzipSync, zipSync, Unzipped } from "fflate";
import { GedcomError } from "./parser.js";

const MAX_ENTRIES = 10_000;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

export function isZip(data: unknown): data is Buffer {
	// only real buffers count – query or body values could be strings or arrays
	if (typeof data === "string" || Array.isArray(data)) return false;
	if (!Buffer.isBuffer(data) || data.length < 4) return false;
	return (
		data[0] === 0x50 &&
		data[1] === 0x4b &&
		data[2] === 0x03 &&
		data[3] === 0x04
	);
}

/** Normalizes paths from GEDCOM FILE lines and zip entries: "C:\\Fotos\\A.jpg" → "fotos/a.jpg" */
export function normalizePath(path: string): string {
	return path
		.trim()
		.replace(/\\/g, "/")
		.replace(/^[a-zA-Z]:\//, "")
		.replace(/^file:\/\/\/?/i, "")
		.replace(/^(\.\/)+/, "")
		.replace(/^\/+/, "")
		.toLowerCase();
}

export interface GedZip {
	gedcom: Uint8Array;
	/** Files by normalized path */
	files: Map<string, Uint8Array>;
}

/**
 * Reads a GEDZIP (zip with one .ged file and the media files).
 * Checks entry count and uncompressed size before extracting.
 */
export function readGedZip(data: Buffer): GedZip {
	let entries = 0;
	let total = 0;
	let unzipped: Unzipped;
	try {
		unzipped = unzipSync(new Uint8Array(data), {
			filter: (file) => {
				entries++;
				total += file.originalSize;
				if (entries > MAX_ENTRIES)
					throw new GedcomError(
						"The zip file contains too many files"
					);
				if (total > MAX_TOTAL_BYTES)
					throw new GedcomError(
						"The zip file is too large when unpacked"
					);
				return !file.name.endsWith("/");
			},
		});
	} catch (error) {
		if (error instanceof GedcomError) throw error;
		throw new GedcomError("The zip file cannot be read");
	}
	const names = Object.keys(unzipped).filter(
		(n) => !n.startsWith("__MACOSX/")
	);
	const gedName = names
		.filter((n) => /\.ged$/i.test(n))
		.sort((a, b) => a.length - b.length)[0];
	if (!gedName) throw new GedcomError("The zip file contains no .ged file");
	const files = new Map<string, Uint8Array>();
	for (const name of names) {
		if (name !== gedName) files.set(normalizePath(name), unzipped[name]);
	}
	return { gedcom: unzipped[gedName], files };
}

export function writeZip(entries: Record<string, Uint8Array>): Uint8Array {
	return zipSync(entries, { level: 6 });
}

/** File type by extension. SVG and unknown types are treated as plain downloads. */
export const MIME_BY_EXTENSION: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	bmp: "image/bmp",
	tif: "image/tiff",
	tiff: "image/tiff",
	pdf: "application/pdf",
	mp4: "video/mp4",
	mov: "video/quicktime",
	webm: "video/webm",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	ogg: "audio/ogg",
	m4a: "audio/mp4",
	txt: "text/plain",
};

export const extensionOf = (path: string) =>
	(/\.([a-z0-9]+)$/i.exec(path)?.[1] ?? "").toLowerCase();
