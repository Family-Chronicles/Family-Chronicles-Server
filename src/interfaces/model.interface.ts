/**
 * Imodel
 * @description
 * @interface
 * @property {string} id - Model id
 * @returns {IModel} - Model instance
 * @example
 * const model: IModel = {
 * 	id: "1"
 * };
 */
export interface IModel {
	readonly Id: string;
}
