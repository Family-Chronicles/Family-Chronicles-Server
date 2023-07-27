// a generic paginator class that provides pagination for any type of data
export class Paginator {
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
}
