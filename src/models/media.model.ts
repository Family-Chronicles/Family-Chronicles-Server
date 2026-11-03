import { IModel } from "../interfaces/model.interface.js";

export const MEDIA_TYPES = [
	"Image",
	"Video",
	"Audio",
	"Text",
	"Document",
	"Other",
] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Picture, video, text, ... that belongs to a person */
export interface Media extends IModel {
	PersonId: string;
	Title: string;
	Description: string;
	Type: MediaType;
	/** Inline content for text media */
	Content: string | null;
	FileName: string | null;
	MimeType: string | null;
	Size: number | null;
	/** Key of the stored file in the file storage */
	StorageKey: string | null;
	CreatedBy: string;
	CreatedAt: string;
	UpdatedAt: string;
}

/** A person referenced ("tagged") on a media item */
export interface MediaTag extends IModel {
	MediaId: string;
	PersonId: string;
	/** Relative position on an image (0..1), optional */
	X: number | null;
	Y: number | null;
	Notes: string;
}
