import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Standardized API response helper class
 */
export class ApiResponseHelper {
  /**
   * Creates a success response
   * @param data The response data
   * @param meta Optional metadata
   * @returns NextResponse with success format
   */
  static success<T>(data: T, meta?: any): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      meta
    });
  }

  /**
   * Creates an error response
   * @param message Error message
   * @param status HTTP status code
   * @param code Optional error code
   * @param details Optional error details
   * @returns NextResponse with error format
   */
  static error(
    message: string, 
    status: number = 500, 
    code?: string, 
    details?: any
  ): NextResponse<ApiErrorResponse> {
    return NextResponse.json({
      success: false,
      error: { 
        message, 
        code,
        details 
      }
    }, { status });
  }

  /**
   * Creates a paginated response
   * @param items The items for the current page
   * @param page Current page number (1-based)
   * @param pageSize Number of items per page
   * @param total Total number of items
   * @returns NextResponse with pagination metadata
   */
  static paginated<T>(
    items: T[], 
    page: number, 
    pageSize: number, 
    total: number
  ): NextResponse<ApiSuccessResponse<T[]>> {
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      } as PaginationMeta & { hasNextPage: boolean; hasPreviousPage: boolean }
    });
  }

  /**
   * Creates a 201 Created response
   * @param data The created resource
   * @param location Optional Location header value
   * @returns NextResponse with 201 status
   */
  static created<T>(data: T, location?: string): NextResponse<ApiSuccessResponse<T>> {
    const response = NextResponse.json({
      success: true,
      data
    }, { status: 201 });

    if (location) {
      response.headers.set('Location', location);
    }

    return response;
  }

  /**
   * Creates a 204 No Content response
   * @returns NextResponse with 204 status
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  /**
   * Creates a 400 Bad Request response
   * @param message Error message
   * @param details Validation error details
   * @returns NextResponse with 400 status
   */
  static badRequest(message: string = 'Bad Request', details?: any): NextResponse<ApiErrorResponse> {
    return this.error(message, 400, 'BAD_REQUEST', details);
  }

  /**
   * Creates a 401 Unauthorized response
   * @param message Error message
   * @returns NextResponse with 401 status
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiErrorResponse> {
    return this.error(message, 401, 'UNAUTHORIZED');
  }

  /**
   * Creates a 403 Forbidden response
   * @param message Error message
   * @returns NextResponse with 403 status
   */
  static forbidden(message: string = 'Forbidden'): NextResponse<ApiErrorResponse> {
    return this.error(message, 403, 'FORBIDDEN');
  }

  /**
   * Creates a 404 Not Found response
   * @param resource The resource that was not found
   * @returns NextResponse with 404 status
   */
  static notFound(resource: string = 'Resource'): NextResponse<ApiErrorResponse> {
    return this.error(`${resource} not found`, 404, 'NOT_FOUND');
  }

  /**
   * Creates a 409 Conflict response
   * @param message Error message
   * @param details Conflict details
   * @returns NextResponse with 409 status
   */
  static conflict(message: string, details?: any): NextResponse<ApiErrorResponse> {
    return this.error(message, 409, 'CONFLICT', details);
  }

  /**
   * Creates a 422 Unprocessable Entity response (validation errors)
   * @param errors Validation errors
   * @returns NextResponse with 422 status
   */
  static validationError(errors: any): NextResponse<ApiErrorResponse> {
    return this.error('Validation failed', 422, 'VALIDATION_ERROR', errors);
  }

  /**
   * Creates a 500 Internal Server Error response
   * @param message Error message
   * @returns NextResponse with 500 status
   */
  static internalError(message: string = 'Internal server error'): NextResponse<ApiErrorResponse> {
    return this.error(message, 500, 'INTERNAL_ERROR');
  }
}

// Export shorthand
export const ApiResponse = ApiResponseHelper;