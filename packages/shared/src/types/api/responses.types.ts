/**
 * Standard API response types
 */

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

/**
 * API metadata for responses
 */
export interface ApiMeta {
  timestamp: string;
  version?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<PaginatedResponse<T>> {}

/**
 * List response without pagination
 */
export interface ListResponse<T> {
  items: T[];
  count: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  succeeded: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: ApiError;
  }>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}