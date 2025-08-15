/**
 * Base pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Base sorting parameters
 */
export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Base search parameters
 */
export interface SearchParams {
  q?: string;
}

/**
 * Base filtering parameters
 */
export interface FilterParams {
  [key: string]: unknown;
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  from?: Date | string;
  to?: Date | string;
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListQueryParams extends 
  PaginationParams, 
  SortingParams, 
  SearchParams {
  filters?: FilterParams;
  dateRange?: DateRangeParams;
}

/**
 * Bulk operation parameters
 */
export interface BulkOperationParams {
  ids: string[];
  action: string;
  data?: unknown;
}

/**
 * Export parameters
 */
export interface ExportParams {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: FilterParams;
  fields?: string[];
}

/**
 * Request with user context
 */
export interface AuthenticatedRequest {
  userId: string;
  userRole: string;
  sessionId?: string;
  deviceId?: string;
}