import { IModel } from "../interfaces/model.interface.js";

/** Long-lived token for machine access, e.g. another instance. Only the hash is stored. */
export interface ApiToken extends IModel {
	UserId: string;
	Name: string;
	TokenHash: string;
	CreatedAt: string;
	LastUsedAt: string | null;
	ExpiresAt: string | null;
}

export const PEER_STATUS = ["Ok", "Unreachable", "Unauthorized"] as const;
export type PeerStatus = (typeof PEER_STATUS)[number];

/** Another Family Chronicles instance this instance can read from */
export interface Peer extends IModel {
	Name: string;
	/** API base URL, e.g. https://chronik.example.org/api/v1 */
	BaseUrl: string;
	/** API token for the other instance, encrypted (AES-256-GCM) */
	TokenEncrypted: string;
	Status: PeerStatus;
	CheckedAt: string;
	CreatedAt: string;
}

export const LINK_RELATIONS = ["SamePerson", "Relative"] as const;
export type LinkRelation = (typeof LINK_RELATIONS)[number];

/** Link from a local person to a person of another instance */
export interface PersonLink extends IModel {
	PersonId: string;
	PeerId: string;
	RemotePersonId: string;
	/** Cached name of the remote person, shown when the peer is unreachable */
	RemoteName: string;
	Relation: LinkRelation;
	Notes: string;
	CreatedAt: string;
}

/** The fields of a remote person this instance shows */
export interface RemotePerson {
	Id: string;
	FirstNames: string[];
	MiddleNames: string[];
	LastNames: string[];
	BirthName: string | null;
	Gender: string;
	DateOfBirth: string | null;
	PlaceOfBirth: string | null;
	DateOfDeath: string | null;
	PlaceOfDeath: string | null;
}
