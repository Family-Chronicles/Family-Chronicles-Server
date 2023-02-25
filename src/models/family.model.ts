export class Family {

	// Properties
	public id: string;
	public Name: string;
	public Description: string;
	public Notes: string;
	public HistoricalNames: string[];

	// Constructor
	constructor(
		id: string,
		Name: string,
		Description: string,
		Notes: string,
		HistoricalNames: string[]
	) {
		this.id = id;
		this.Name = Name;
		this.Description = Description;
		this.Notes = Notes;
		this.HistoricalNames = HistoricalNames;
	}
}
