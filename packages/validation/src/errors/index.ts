import { BaseError, ErrorCode } from './base';
import type { ErrorContext } from './base';
import { ZodError } from 'zod';
import type { ZodIssue } from 'zod';

export * from './base';

// Validation Error
export class ValidationError extends BaseError {
  public readonly fields?: Record<string, string[]>;
  
  constructor(message: string, fields?: Record<string, string[]>, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, { ...context, fields });
    this.fields = fields;
  }
  
  static fromZodError(error: ZodError): ValidationError {
    const fields: Record<string, string[]> = {};
    
    error.issues.forEach((issue: ZodIssue) => {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    });
    
    const message = Object.entries(fields)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');
    
    return new ValidationError(
      message || 'Validation failed',
      fields
    );
  }
  
  static singleField(field: string, message: string): ValidationError {
    return new ValidationError('Validation failed', {
      [field]: [message]
    });
  }
}

// Authentication Errors
export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required', context?: ErrorContext) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor(message = 'Invalid credentials provided') {
    super(message, ErrorCode.INVALID_CREDENTIALS, 401);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message = 'Token has expired') {
    super(message, ErrorCode.TOKEN_EXPIRED, 401);
  }
}

export class TwoFactorRequiredError extends BaseError {
  constructor(message = 'Two-factor authentication required', userId?: string) {
    super(message, ErrorCode.TWO_FACTOR_REQUIRED, 401, true, { userId });
  }
}

// Authorization Errors
export class AuthorizationError extends BaseError {
  constructor(message = 'Insufficient permissions', requiredPermission?: string) {
    super(message, ErrorCode.FORBIDDEN, 403, true, { requiredPermission });
  }
}

export class AccountSuspendedError extends BaseError {
  constructor(reason?: string) {
    super(
      'Account has been suspended',
      ErrorCode.ACCOUNT_SUSPENDED,
      403,
      true,
      { reason }
    );
  }
}

export class AccountLockedError extends BaseError {
  constructor(unlockAt?: Date) {
    super(
      'Account has been locked due to too many failed attempts',
      ErrorCode.ACCOUNT_LOCKED,
      403,
      true,
      { unlockAt }
    );
  }
}

// Resource Errors
export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, true, { resource, id });
  }
}

// Conflict Errors
export class ConflictError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.CONFLICT, 409, true, context);
  }
}

export class DuplicateEntryError extends BaseError {
  constructor(resource: string, field: string, value: any) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      ErrorCode.DUPLICATE_ENTRY,
      409,
      true,
      { resource, field, value }
    );
  }
}

// Rate Limiting Error
export class RateLimitError extends BaseError {
  public readonly retryAfter: number;
  
  constructor(retryAfter: number, limit?: number, window?: string) {
    super(
      `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      ErrorCode.RATE_LIMITED,
      429,
      true,
      { retryAfter, limit, window }
    );
    this.retryAfter = retryAfter;
  }
}

// Business Logic Errors
export class BusinessLogicError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.BUSINESS_ERROR, 422, true, context);
  }
}

export class InsufficientFundsError extends BaseError {
  constructor(required: number, available: number) {
    super(
      'Insufficient funds for this operation',
      ErrorCode.INSUFFICIENT_FUNDS,
      422,
      true,
      { required, available }
    );
  }
}

export class QuotaExceededError extends BaseError {
  constructor(resource: string, limit: number, used: number) {
    super(
      `${resource} quota exceeded`,
      ErrorCode.QUOTA_EXCEEDED,
      422,
      true,
      { resource, limit, used }
    );
  }
}

export class InvalidStateTransitionError extends BaseError {
  constructor(entity: string, fromState: string, toState: string) {
    super(
      `Invalid state transition for ${entity} from ${fromState} to ${toState}`,
      ErrorCode.INVALID_STATE_TRANSITION,
      422,
      true,
      { entity, fromState, toState }
    );
  }
}

// Server Errors
export class InternalServerError extends BaseError {
  constructor(message = 'Internal server error', originalError?: any) {
    super(
      message,
      ErrorCode.INTERNAL_ERROR,
      500,
      false,
      { originalError: originalError?.message }
    );
  }
}

export class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', operation?: string, originalError?: any) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      500,
      false,
      { operation, originalError: originalError?.message }
    );
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, message?: string, originalError?: any) {
    super(
      message || `External service ${service} failed`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      false,
      { service, originalError: originalError?.message }
    );
  }
}

// Error Handler
export class ErrorHandler {
  static handle(error: any): {
    statusCode: number;
    body: any;
    headers?: Record<string, string>;
  } {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = ValidationError.fromZodError(error);
      return {
        statusCode: validationError.statusCode,
        body: validationError.toJSON(),
      };
    }
    
    // Handle custom errors
    if (error instanceof BaseError) {
      const response: any = {
        statusCode: error.statusCode,
        body: error.toJSON(),
      };
      
      // Add retry header for rate limit errors
      if (error instanceof RateLimitError) {
        response.headers = {
          'Retry-After': error.retryAfter.toString(),
          'X-RateLimit-Limit': error.context?.limit?.toString() || '',
          'X-RateLimit-Reset': new Date(Date.now() + error.retryAfter * 1000).toISOString(),
        };
      }
      
      return response;
    }
    
    // Handle Prisma errors
    if (error.code?.startsWith('P')) {
      return this.handlePrismaError(error);
    }
    
    // Default error
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: {
        message: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR,
        timestamp: new Date(),
      },
    };
  }
  
  private static handlePrismaError(error: any) {
    switch (error.code) {
      case 'P2002':
        const field = error.meta?.target?.[0] || 'field';
        return {
          statusCode: 409,
          body: new DuplicateEntryError('Record', field, 'value').toJSON(),
        };
      
      case 'P2025':
        return {
          statusCode: 404,
          body: new NotFoundError('Record').toJSON(),
        };
      
      case 'P2003':
        return {
          statusCode: 400,
          body: new ValidationError('Foreign key constraint failed', {
            [error.meta?.field_name || 'field']: ['Invalid reference']
          }).toJSON(),
        };
      
      case 'P2014':
        return {
          statusCode: 400,
          body: new ValidationError('Invalid relation data').toJSON(),
        };
      
      default:
        return {
          statusCode: 500,
          body: new DatabaseError('Database error occurred').toJSON(),
        };
    }
  }
  
  static isOperationalError(error: any): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }
  
  static logError(error: any, context?: any): void {
    if (error instanceof BaseError) {
      console.error({
        ...error.toJSON(),
        context,
        isOperational: error.isOperational,
      });
    } else {
      console.error({
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
      });
    }
  }
}