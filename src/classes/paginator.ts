// a generic paginator class that provides pagination for any type of data
export default class Paginator {
	/**
	 * Paginates paginator
	 * @template T
	 * @param items
	 * @param currentPage
	 * @param pageSize
	 * @returns paginate
	 */
	public static paginate<T>(
		items: T[],
		currentPage: number,
		pageSize: number
	): T[] {
		if (!items || !items.length) return [];
		if (!currentPage) currentPage = 1;
		if (!pageSize) pageSize = 10;

		const startIndex = (currentPage - 1) * pageSize;
		return items.slice(startIndex, startIndex + pageSize);
	}

	/**
	 * Gets page count
	 * @template T
	 * @param items
	 * @param pageSize
	 * @returns page count
	 */
	public static getPageCount<T>(items: T[], pageSize: number): number {
		if (!items || !items.length) return 0;
		if (!pageSize) pageSize = 10;

		return Math.ceil(items.length / pageSize);
	}
}
