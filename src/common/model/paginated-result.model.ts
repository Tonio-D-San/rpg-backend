export class PaginatedResultModel<T> {
  constructor(
    public readonly items: T[],
    public readonly totalItems: number,
  ) {}
}
