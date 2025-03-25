/**
 * Gedcom converter
 * @class GedcomConverter
 * @classdesc Converts gedcom to json and vice versa
 * @example
 * const gedcom = `0 @I1@ INDI
 * 1 NAME Jamis Gordon /Buck/
 * 2 SURN Buck
 * 2 GIVN Jamis Gordon
 * `;
 * const gedcomConverter = GedcomConverter.getInstance();
 * const json = gedcomConverter.gedcomToJson(gedcom);
 * const gedcom2 = gedcomConverter.jsonToGedcom(json);
 * console.log(gedcom2);
 */
export default class GedcomConverter {
	private static _instance: GedcomConverter;

	private constructor() {}

	public static getInstance() {
		if (!GedcomConverter._instance) {
			GedcomConverter._instance = new GedcomConverter();
		}
		return GedcomConverter._instance;
	}

	private parseLine(line: string) {
		const [tag, ...rest] = line.split(" ");
		const value = rest.join(" ");
		return { tag, value };
	}

	private parseGedcom(gedcom: string) {
		const lines = gedcom.split("\n");
		const result: any = {};

		let currentObject: any = result;
		let stack: any[] = [result];

		lines.forEach((line) => {
			line = line.trim();
			if (line.length === 0) return; // Ignore empty lines

			if (line.startsWith("0 ")) {
				currentObject = result;
				stack = [result];
			}

			const { tag, value } = this.parseLine(line);
			if (tag === "0") return; // Skip level 0, as it's already handled

			if (tag === "TRLR") {
				currentObject = result;
				stack = [result];
				return;
			}

			const newObject: any = { tag, value };
			if (!currentObject[tag]) {
				currentObject[tag] = newObject;
			} else {
				if (!Array.isArray(currentObject[tag])) {
					currentObject[tag] = [currentObject[tag]];
				}
				currentObject[tag].push(newObject);
			}

			stack.push(currentObject);
			currentObject = newObject;
		});

		return result;
	}

	private serializeObject(obj: any) {
		let gedcom = "";
		for (const key in obj) {
			const value = obj[key];
			if (Array.isArray(value)) {
				value.forEach((item: any) => {
					gedcom += this.serializeObject(item);
				});
			} else {
				gedcom += `${key} ${value}\n`;
			}
		}
		return gedcom;
	}

	public gedcomToJson(gedcom: string) {
		const parsedData = this.parseGedcom(gedcom);
		return JSON.stringify(parsedData, null, 2);
	}

	public jsonToGedcom(json: string) {
		const parsedData = JSON.parse(json);
		return this.serializeObject(parsedData);
	}
}
