/**
 * Conversion between GEDCOM dates ("12 APR 1901", "ABT 1901", ...) and the
 * partial ISO dates used by the API ("1901-04-12", "1901-04", "1901").
 */

const MONTHS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
];

export interface ParsedDate {
	/** Partial ISO date, or null when it could not be read */
	value: string | null;
	/** True when the GEDCOM date was not an exact date (ABT, BEF, BET, ...) */
	approximate: boolean;
}

const SINGLE = /^(?:(\d{1,2})\s+)?(?:([A-Z]{3})\s+)?(\d{3,4})(?:\/\d{2})?$/;

function parseSingle(s: string): string | null {
	const m = SINGLE.exec(s.trim().toUpperCase());
	if (!m) return null;
	const [, day, mon, year] = m;
	const y = year.padStart(4, "0");
	if (!mon) return day ? null : y;
	const month = MONTHS.indexOf(mon) + 1;
	if (month === 0) return null;
	const mm = String(month).padStart(2, "0");
	if (!day) return `${y}-${mm}`;
	const d = Number(day);
	if (d < 1 || d > 31) return null;
	return `${y}-${mm}-${String(d).padStart(2, "0")}`;
}

export function fromGedcomDate(raw: string): ParsedDate {
	let s = raw.trim().toUpperCase();
	if (!s) return { value: null, approximate: false };
	// "INT 1901 (text)" – interpreted date
	s = s.replace(/\(.*\)$/, "").trim();
	let approximate = false;
	const modifier = /^(ABT|CAL|EST|BEF|AFT|INT|FROM|TO|BET)\s+/.exec(s);
	if (modifier) {
		approximate = true;
		s = s.slice(modifier[0].length);
		// "BET x AND y" / "FROM x TO y": use the first date
		s = s.split(/\s+(?:AND|TO)\s+/)[0];
	}
	if (s.startsWith("@#D")) {
		// calendar escape, e.g. @#DJULIAN@ – keep the date, mark as approximate
		approximate = true;
		s = s.replace(/^@#D[^@]+@\s*/, "");
	}
	const value = parseSingle(s);
	return { value, approximate: approximate || value === null };
}

export function toGedcomDate(iso: string | null): string | null {
	if (!iso) return null;
	const [y, m, d] = iso.split("-");
	const parts = [];
	if (d) parts.push(String(Number(d)));
	if (m) parts.push(MONTHS[Number(m) - 1]);
	parts.push(y);
	return parts.join(" ");
}
