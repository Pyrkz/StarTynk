import { ApiResponse, ApiError } from '../types/interfaces/api.interface';
import { PaginatedResponse } from '../types/api/responses.types';

/**
 * Create a successful API response
 */
export const createSuccessResponse = <T>(data: T, meta?: any): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

/**
 * Create an error API response
 */
export const createErrorResponse = (error: ApiError, meta?: any): ApiResponse => ({
  success: false,
  error,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

/**
 * Create a paginated response
 */
export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
});

/**
 * Check if a response is successful
 */
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
  return response.success === true && response.data !== undefined;
};

/**
 * Check if a response is an error
 */
export const isErrorResponse = (response: ApiResponse): response is ApiResponse & { error: ApiError } => {
  return response.success === false && response.error !== undefined;
};

/**
 * Extract error message from API response
 */
export const getErrorMessage = (response: ApiResponse): string => {
  if (isErrorResponse(response)) {
    return response.error.message;
  }
  return 'Unknown error occurred';
};

/**
 * Create an API error object
 */
export const createApiError = (
  code: string,
  message: string,
  field?: string,
  details?: Record<string, any>
): ApiError => ({
  code,
  message,
  field,
  details,
});