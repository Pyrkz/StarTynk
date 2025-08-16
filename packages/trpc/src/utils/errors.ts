import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

/**
 * Business logic error codes
 */
export enum BusinessErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  INVALID_OPERATION = 'INVALID_OPERATION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
}

/**
 * Custom business error class
 */
export class BusinessError extends Error {
  public readonly code: BusinessErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: BusinessErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Create standardized business errors
 */
export const createBusinessError = {
  userNotFound: (userId?: string) =>
    new BusinessError(
      BusinessErrorCode.USER_NOT_FOUND,
      'User not found',
      404,
      { userId }
    ),

  invalidCredentials: () =>
    new BusinessError(
      BusinessErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password',
      401
    ),

  insufficientPermissions: (requiredRole?: string) =>
    new BusinessError(
      BusinessErrorCode.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions to perform this action',
      403,
      { requiredRole }
    ),

  resourceNotFound: (resource: string, id?: string) =>
    new BusinessError(
      BusinessErrorCode.RESOURCE_NOT_FOUND,
      `${resource} not found`,
      404,
      { resource, id }
    ),

  duplicateResource: (resource: string, field?: string, value?: any) =>
    new BusinessError(
      BusinessErrorCode.DUPLICATE_RESOURCE,
      `${resource} already exists`,
      409,
      { resource, field, value }
    ),

  invalidOperation: (operation: string, reason?: string) =>
    new BusinessError(
      BusinessErrorCode.INVALID_OPERATION,
      `Cannot perform ${operation}${reason ? `: ${reason}` : ''}`,
      400,
      { operation, reason }
    ),

  quotaExceeded: (resource: string, limit: number, current: number) =>
    new BusinessError(
      BusinessErrorCode.QUOTA_EXCEEDED,
      `${resource} quota exceeded (${current}/${limit})`,
      429,
      { resource, limit, current }
    ),

  externalServiceError: (service: string, originalError?: string) =>
    new BusinessError(
      BusinessErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      502,
      { service, originalError }
    ),

  validationError: (field: string, message: string) =>
    new BusinessError(
      BusinessErrorCode.VALIDATION_ERROR,
      `Validation error: ${field} - ${message}`,
      400,
      { field, message }
    ),

  rateLimitExceeded: (limit: number, windowMs: number) =>
    new BusinessError(
      BusinessErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      429,
      { limit, windowMs }
    ),

  tokenExpired: () =>
    new BusinessError(
      BusinessErrorCode.TOKEN_EXPIRED,
      'Authentication token has expired',
      401
    ),

  tokenInvalid: () =>
    new BusinessError(
      BusinessErrorCode.TOKEN_INVALID,
      'Invalid authentication token',
      401
    ),

  accountDisabled: () =>
    new BusinessError(
      BusinessErrorCode.ACCOUNT_DISABLED,
      'Account has been disabled',
      403
    ),

  featureNotAvailable: (feature: string) =>
    new BusinessError(
      BusinessErrorCode.FEATURE_NOT_AVAILABLE,
      `Feature not available: ${feature}`,
      501,
      { feature }
    ),
};

/**
 * Convert business errors to tRPC errors
 */
export function businessErrorToTRPC(error: BusinessError): TRPCError {
  const trpcCode = httpStatusToTRPCCode(error.statusCode);
  
  return new TRPCError({
    code: trpcCode,
    message: error.message,
    cause: {
      businessCode: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
  });
}

/**
 * Convert HTTP status codes to tRPC codes
 */
function httpStatusToTRPCCode(statusCode: number) {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST' as const;
    case 401:
      return 'UNAUTHORIZED' as const;
    case 403:
      return 'FORBIDDEN' as const;
    case 404:
      return 'NOT_FOUND' as const;
    case 409:
      return 'CONFLICT' as const;
    case 429:
      return 'TOO_MANY_REQUESTS' as const;
    case 500:
      return 'INTERNAL_SERVER_ERROR' as const;
    case 501:
      return 'METHOD_NOT_SUPPORTED' as const;
    case 502:
    case 503:
    case 504:
      return 'INTERNAL_SERVER_ERROR' as const;
    default:
      return 'INTERNAL_SERVER_ERROR' as const;
  }
}

/**
 * Handle Prisma errors and convert to business errors
 */
export function handlePrismaError(error: any): BusinessError {
  if (error.code === 'P2002') {
    // Unique constraint violation
    const target = error.meta?.target?.[0] || 'resource';
    return createBusinessError.duplicateResource(target, target);
  }
  
  if (error.code === 'P2025') {
    // Record not found
    return createBusinessError.resourceNotFound('record');
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint violation
    return createBusinessError.invalidOperation(
      'operation',
      'would violate data integrity'
    );
  }
  
  if (error.code === 'P2016') {
    // Query interpretation error
    return createBusinessError.validationError('query', 'invalid query parameters');
  }
  
  // Default to generic error
  throw new BusinessError(
    BusinessErrorCode.EXTERNAL_SERVICE_ERROR,
    'Database operation failed',
    500,
    { originalError: error.message, code: error.code }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): BusinessError {
  const firstError = error.errors[0];
  const field = firstError.path.join('.');
  const message = firstError.message;
  
  return createBusinessError.validationError(field, message);
}

/**
 * Generic error handler that converts various error types to tRPC errors
 */
export function handleError(error: unknown): TRPCError {
  // Business errors
  if (error instanceof BusinessError) {
    return businessErrorToTRPC(error);
  }
  
  // tRPC errors (pass through)
  if (error instanceof TRPCError) {
    return error;
  }
  
  // Zod validation errors
  if (error instanceof ZodError) {
    const businessError = handleZodError(error);
    return businessErrorToTRPC(businessError);
  }
  
  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    try {
      const businessError = handlePrismaError(error);
      return businessErrorToTRPC(businessError);
    } catch (prismaError) {
      // If Prisma error handling fails, fall through to generic error
    }
  }
  
  // Network/timeout errors
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return new TRPCError({
        code: 'TIMEOUT',
        message: 'Request timed out',
        cause: error,
      });
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service unavailable',
        cause: error,
      });
    }
  }
  
  // Generic error fallback
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    cause: error,
  });
}

/**
 * Wrapper function to safely execute operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Add context to error if provided
    if (context && error instanceof Error) {
      error.message = `${context}: ${error.message}`;
    }
    
    throw handleError(error);
  }
}

/**
 * Create error logger
 */
export function createErrorLogger(requestId?: string) {
  return (error: unknown, context?: string) => {
    const errorInfo = {
      requestId,
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
    };
    
    console.error('🚨 Error:', errorInfo);
    
    // In production, you would send this to your logging service
    // Example: logger.error('tRPC Error', errorInfo);
  };
}

/**
 * Error boundaries for async operations
 */
export class AsyncErrorBoundary {
  private static errors: Map<string, Error[]> = new Map();
  
  static async execute<T>(
    key: string,
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear errors on success
        this.errors.delete(key);
        
        return result;
      } catch (error) {
        // Track errors
        const keyErrors = this.errors.get(key) || [];
        keyErrors.push(error instanceof Error ? error : new Error(String(error)));
        this.errors.set(key, keyErrors);
        
        // If last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000))
        );
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  static getErrors(key: string): Error[] {
    return this.errors.get(key) || [];
  }
  
  static clearErrors(key: string): void {
    this.errors.delete(key);
  }
}

/**
 * Error codes to HTTP status mapping
 */
export const ERROR_CODE_TO_HTTP_STATUS = {
  [BusinessErrorCode.USER_NOT_FOUND]: 404,
  [BusinessErrorCode.INVALID_CREDENTIALS]: 401,
  [BusinessErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [BusinessErrorCode.RESOURCE_NOT_FOUND]: 404,
  [BusinessErrorCode.DUPLICATE_RESOURCE]: 409,
  [BusinessErrorCode.INVALID_OPERATION]: 400,
  [BusinessErrorCode.QUOTA_EXCEEDED]: 429,
  [BusinessErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [BusinessErrorCode.VALIDATION_ERROR]: 400,
  [BusinessErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [BusinessErrorCode.TOKEN_EXPIRED]: 401,
  [BusinessErrorCode.TOKEN_INVALID]: 401,
  [BusinessErrorCode.ACCOUNT_DISABLED]: 403,
  [BusinessErrorCode.FEATURE_NOT_AVAILABLE]: 501,
} as const;