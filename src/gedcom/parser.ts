/**
 * Minimal, tolerant GEDCOM 5.5.1 line parser.
 * Produces a record tree and merges CONC/CONT continuation lines into their parent value.
 */

export interface GedcomNode {
	level: number;
	xref: string | null;
	tag: string;
	value: string;
	line: number;
	children: GedcomNode[];
}

export interface ParseResult {
	records: GedcomNode[];
	warnings: string[];
}

export class GedcomError extends Error {
	constructor(message: string, public readonly line?: number) {
		super(line ? `Line ${line}: ${message}` : message);
	}
}

const LINE = /^\s*(\d{1,2})\s+(?:(@[^@\s]+@)\s+)?([A-Za-z0-9_]+)(?: (.*))?$/;

/** Decodes a GEDCOM file: UTF-8 (with or without BOM), falling back to Latin-1 */
export function decodeGedcom(data: Buffer | string): {
	text: string;
	warnings: string[];
} {
	if (typeof data === "string")
		return { text: data.replace(/^\uFEFF/, ""), warnings: [] };
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
		return { text: text.replace(/^\uFEFF/, ""), warnings: [] };
	} catch {
		return {
			text: new TextDecoder("latin1").decode(data),
			warnings: [
				"File is not valid UTF-8, it was read as Latin-1. Special characters (ANSEL) may be wrong.",
			],
		};
	}
}

export function parseGedcom(text: string): ParseResult {
	const warnings: string[] = [];
	const records: GedcomNode[] = [];
	const stack: GedcomNode[] = [];
	const lines = text.split(/\r\n|\r|\n/);

	lines.forEach((raw, index) => {
		const lineNo = index + 1;
		if (raw.trim() === "") return;
		const match = LINE.exec(raw);
		if (!match)
			throw new GedcomError(
				`Invalid GEDCOM line "${raw.slice(0, 60)}"`,
				lineNo
			);

		const level = Number(match[1]);
		const node: GedcomNode = {
			level,
			xref: match[2] ?? null,
			tag: match[3].toUpperCase(),
			value: match[4] ?? "",
			line: lineNo,
			children: [],
		};

		if (level === 0) {
			stack.length = 0;
			records.push(node);
			stack.push(node);
			return;
		}
		if (stack.length === 0) {
			throw new GedcomError(
				"The file must start with a level 0 record (HEAD)",
				lineNo
			);
		}
		while (stack.length > level) stack.pop();
		const parent = stack[stack.length - 1];
		if (stack.length !== level || !parent) {
			throw new GedcomError(
				`Level ${level} does not follow level ${stack.length - 1}`,
				lineNo
			);
		}

		if (node.tag === "CONC") {
			parent.value += node.value;
			return;
		}
		if (node.tag === "CONT") {
			parent.value += "\n" + node.value;
			return;
		}
		parent.children.push(node);
		stack.push(node);
	});

	if (records[0]?.tag !== "HEAD") {
		throw new GedcomError("The file must start with a HEAD record");
	}
	if (records[records.length - 1]?.tag !== "TRLR") {
		warnings.push(
			"The file does not end with TRLR – it may be incomplete."
		);
	}
	return { records, warnings };
}

/** First child with the given tag */
export const child = (node: GedcomNode, tag: string) =>
	node.children.find((c) => c.tag === tag);

/** Value of the first child with the given tag */
export const childValue = (node: GedcomNode, tag: string) =>
	child(node, tag)?.value.trim() ?? "";

export const childrenOf = (node: GedcomNode, tag: string) =>
	node.children.filter((c) => c.tag === tag);
