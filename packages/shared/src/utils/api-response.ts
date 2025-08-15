export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: any;
  timestamp: string;
  version: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
  };
  version: string;
}

export type ApiResponseType<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HttpResponse<T> {
  body: T;
  status: number;
}

export class ApiResponseHelper {
  private static readonly API_VERSION = 'v1';

  static success<T>(
    data: T,
    meta?: any,
    status = 200
  ): HttpResponse<ApiSuccessResponse<T>> {
    return {
      body: {
        success: true,
        data,
        meta,
        timestamp: new Date().toISOString(),
        version: this.API_VERSION,
      },
      status
    };
  }

  static created<T>(data: T, meta?: any): HttpResponse<ApiSuccessResponse<T>> {
    return this.success(data, meta, 201);
  }

  static noContent(): HttpResponse<null> {
    return { body: null, status: 204 };
  }

  static error(
    message: string,
    status: number,
    code?: string,
    details?: any
  ): HttpResponse<ApiErrorResponse> {
    return {
      body: {
        success: false,
        error: {
          message,
          code: code || 'ERROR',
          details,
          timestamp: new Date().toISOString(),
        },
        version: this.API_VERSION,
      },
      status
    };
  }

  static fromError(error: unknown): HttpResponse<ApiErrorResponse> {
    // Handle known error types
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const appError = error as any;
      return this.error(
        appError.message || 'An error occurred',
        appError.statusCode,
        appError.code
      );
    }

    // Handle validation errors
    if (error && typeof error === 'object' && 'errors' in error) {
      const validationError = error as any;
      return this.validationError(validationError.errors);
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return this.conflict('Resource already exists');
      }
      if (prismaError.code === 'P2025') {
        return this.notFound('Resource not found');
      }
    }

    // Default error
    console.error('Unhandled error:', error);
    return this.internalServerError();
  }

  static validationError(errors: any): HttpResponse<ApiErrorResponse> {
    return {
      body: {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        },
        version: this.API_VERSION,
      },
      status: 400
    };
  }

  static unauthorized(message = 'Unauthorized'): HttpResponse<ApiErrorResponse> {
    return this.error(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): HttpResponse<ApiErrorResponse> {
    return this.error(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Not found'): HttpResponse<ApiErrorResponse> {
    return this.error(message, 404, 'NOT_FOUND');
  }

  static badRequest(message = 'Bad request'): HttpResponse<ApiErrorResponse> {
    return this.error(message, 400, 'BAD_REQUEST');
  }

  static conflict(message = 'Conflict'): HttpResponse<ApiErrorResponse> {
    return this.error(message, 409, 'CONFLICT');
  }

  static tooManyRequests(
    message = 'Too many requests'
  ): HttpResponse<ApiErrorResponse> {
    return this.error(message, 429, 'RATE_LIMIT');
  }

  static internalServerError(
    message = 'Internal server error'
  ): HttpResponse<ApiErrorResponse> {
    return this.error(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

// Export as default for convenience
export const ApiResponseBuilder = ApiResponseHelper;