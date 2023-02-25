export class TaggedPerson {

	// Properties
	id: string;
	personId: string;
	lat: number | null;
	lng: number | null;
	timeStamp: Date | null;
	notes: string;

	// Constructor
	constructor(
		id: string,
		personId: string,
		lat: number | null,
		lng: number | null,
		timeStamp: Date | null,
		notes: string
	) {
		this.id = id;
		this.personId = personId;
		this.lat = lat;
		this.lng = lng;
		this.timeStamp = timeStamp;
		this.notes = notes;
	}

}
