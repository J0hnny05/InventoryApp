export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface PagedQuery {
  skip?: number;
  take?: number;
}
