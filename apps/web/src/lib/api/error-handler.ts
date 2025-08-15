import { ZodError } from 'zod';
import { Prisma } from '@repo/database';
import { ApiResponse } from './response';
import { NextResponse } from 'next/server';

/**
 * Centralized error handler for API routes
 * @param error The error to handle
 * @returns Standardized error response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    return ApiResponse.validationError(formattedErrors);
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined;
        return ApiResponse.conflict(
          `A record with this ${field?.join(', ') || 'value'} already exists`
        );
      
      case 'P2025':
        // Record not found
        return ApiResponse.notFound();
      
      case 'P2003':
        // Foreign key constraint violation
        return ApiResponse.badRequest('Invalid reference to related record');
      
      default:
        return ApiResponse.internalError('Database operation failed');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.badRequest('Invalid data provided');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ApiResponse.internalError('Database connection failed');
  }

  // Handle custom errors
  if (error instanceof Error) {
    // Check for specific error types based on message
    if (error.message.includes('Unauthorized')) {
      return ApiResponse.unauthorized(error.message);
    }
    
    if (error.message.includes('Forbidden')) {
      return ApiResponse.forbidden(error.message);
    }
    
    if (error.message.includes('Not found')) {
      return ApiResponse.notFound(error.message.replace(' not found', ''));
    }
    
    if (error.message.includes('already exists')) {
      return ApiResponse.conflict(error.message);
    }

    // Default error response
    return ApiResponse.internalError(
      process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred'
    );
  }

  // Unknown error type
  return ApiResponse.internalError('An unexpected error occurred');
}

/**
 * Wraps an async API handler with error handling
 * @param handler The async handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}