import { ApiResponse } from './api-response';

export class ErrorResponse {
  static badRequest(message: string = 'Bad Request', details?: any) {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'BAD_REQUEST', details)),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'UNAUTHORIZED')),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static forbidden(message: string = 'Forbidden') {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'FORBIDDEN')),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static notFound(message: string = 'Resource not found') {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'NOT_FOUND')),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static conflict(message: string, details?: any) {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'CONFLICT', details)),
      { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static validationError(message: string = 'Validation failed', details?: any) {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'VALIDATION_ERROR', details)),
      { 
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static rateLimitExceeded(message: string = 'Rate limit exceeded') {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'RATE_LIMIT_EXCEEDED')),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static internalError(message: string = 'Internal server error') {
    return new Response(
      JSON.stringify(ApiResponse.error(message, 'INTERNAL_ERROR')),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}