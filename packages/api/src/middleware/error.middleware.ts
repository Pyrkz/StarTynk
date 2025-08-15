import { ApiError } from '../errors';
import { ErrorResponse } from '../responses';
import { Prisma } from '@repo/database';
import { ZodError } from 'zod';

export async function errorHandler(
  error: unknown,
  request: Request
): Promise<Response> {
  const requestId = crypto.randomUUID();
  
  console.error('API Error:', {
    requestId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId
        }
      }),
      { 
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return ErrorResponse.validationError('Validation failed', formattedErrors);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = error.meta?.target as string[] || [];
        return ErrorResponse.conflict(
          `Duplicate entry for ${target.join(', ')}`,
          { field: target[0], code: error.code }
        );
      
      case 'P2025':
        return ErrorResponse.notFound('Record not found');
      
      case 'P2003':
        return ErrorResponse.badRequest(
          'Foreign key constraint failed',
          { code: error.code }
        );
      
      case 'P2014':
        return ErrorResponse.badRequest(
          'Invalid relation',
          { code: error.code }
        );
      
      default:
        console.error('Unhandled Prisma error:', error);
        return ErrorResponse.internalError('Database error occurred');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ErrorResponse.badRequest('Invalid data provided');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Database connection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          timestamp: new Date().toISOString(),
          requestId
        }
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'External service unavailable',
          code: 'EXTERNAL_SERVICE_ERROR',
          timestamp: new Date().toISOString(),
          requestId
        }
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.error('Unhandled error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId
      }
    }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}