import { EventType } from "../models/person.model.js";

/** GEDCOM individual event/attribute tags and their event type */
export const EVENT_TAGS: Record<string, EventType> = {
	BAPM: "Baptism",
	CHR: "Baptism",
	CONF: "Confirmation",
	BURI: "Burial",
	CREM: "Cremation",
	OCCU: "Occupation",
	RESI: "Residence",
	EDUC: "Education",
	EMIG: "Emigration",
	IMMI: "Immigration",
	NATU: "Naturalization",
	_MILT: "Military",
	RELI: "Religion",
	EVEN: "Other",
};

/** Tag used when exporting an event type */
export const TAG_FOR_EVENT: Record<EventType, string> = {
	Baptism: "BAPM",
	Confirmation: "CONF",
	Burial: "BURI",
	Cremation: "CREM",
	Occupation: "OCCU",
	Residence: "RESI",
	Education: "EDUC",
	Emigration: "EMIG",
	Immigration: "IMMI",
	Naturalization: "NATU",
	Military: "_MILT",
	Religion: "RELI",
	Other: "EVEN",
};
