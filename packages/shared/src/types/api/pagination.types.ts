/**
 * Pagination related types
 */

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended pagination with filters
 */
export interface PaginationWithFilters<T = Record<string, any>> extends PaginationParams {
  filters?: T;
}

/**
 * Cursor-based pagination params
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Cursor pagination response
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
}