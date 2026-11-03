import { DateString, IModel } from "../interfaces/model.interface.js";

export interface Family extends IModel {
	Name: string;
	Description: string;
	Notes: string;
	HistoricalNames: string[];
	CreatedAt: string;
	UpdatedAt: string;
}

/** Link between a person and a family, with a role (e.g. "Mutter", "Stiefkind") */
export interface FamilyMembership extends IModel {
	FamilyId: string;
	PersonId: string;
	Role: string;
	StartDate: DateString;
	EndDate: DateString;
	Notes: string;
}
