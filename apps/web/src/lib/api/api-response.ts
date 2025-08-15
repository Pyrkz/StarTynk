import { NextResponse } from 'next/server';
import { getCorsHeaders, SECURITY_HEADERS } from '@/lib/auth/security';

export class ApiResponse {
  /**
   * Success response
   */
  static success(data?: any, status: number = 200) {
    return NextResponse.json(
      { success: true, ...data },
      { 
        status,
        headers: {
          ...SECURITY_HEADERS,
          ...getCorsHeaders(),
        }
      }
    );
  }
  
  /**
   * Error response
   */
  static error(message: string, status: number = 500, details?: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        ...(details && { details })
      },
      { 
        status,
        headers: {
          ...SECURITY_HEADERS,
          ...getCorsHeaders(),
        }
      }
    );
  }
  
  /**
   * Bad request (400)
   */
  static badRequest(message: string, details?: any) {
    return this.error(message, 400, details);
  }
  
  /**
   * Unauthorized (401)
   */
  static unauthorized(message: string = 'Unauthorized') {
    return this.error(message, 401);
  }
  
  /**
   * Forbidden (403)
   */
  static forbidden(message: string = 'Forbidden') {
    return this.error(message, 403);
  }
  
  /**
   * Not found (404)
   */
  static notFound(message: string = 'Not found') {
    return this.error(message, 404);
  }
  
  /**
   * Conflict (409)
   */
  static conflict(message: string) {
    return this.error(message, 409);
  }
  
  /**
   * Too many requests (429)
   */
  static tooManyRequests(message: string = 'Too many requests') {
    return this.error(message, 429);
  }
  
  /**
   * Internal server error (500)
   */
  static internalServerError(message: string = 'Internal server error') {
    return this.error(message, 500);
  }
}