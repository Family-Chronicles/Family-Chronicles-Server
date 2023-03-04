export class Family {
	// Properties
	public readonly id: string;
	public Name: string;
	public Description: string;
	public Notes: string;
	public HistoricalNames: string[];

	// Constructor
	constructor(
		id: string | null | undefined,
		Name: string,
		Description: string,
		Notes: string,
		HistoricalNames: string[]
	) {
		if (id === "" || id === null || id === undefined) {
			this.id = crypto.randomUUID();
		} else {
			this.id = id;
		}
		this.Name = Name;
		this.Description = Description;
		this.Notes = Notes;
		this.HistoricalNames = HistoricalNames;
	}
}
