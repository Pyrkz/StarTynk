/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * List response with metadata
 */
export interface ListResponse<T = unknown> {
  data: T[];
  meta: {
    total: number;
    filtered: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * Simple success response
 */
export interface SuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Upload response
 */
export interface UploadResponse {
  success: boolean;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
  };
  message?: string;
  timestamp: string;
}