export class BusinessError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;
  public readonly statusCode?: number;

  constructor(
    message: string, 
    originalError?: unknown, 
    code = 'BUSINESS_ERROR',
    statusCode = 400
  ) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError instanceof Error ? originalError : undefined;

    // Maintains proper stack trace for where our error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError);
    }
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message = 'Unauthorized access') {
    super(message, undefined, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message = 'Access forbidden') {
    super(message, undefined, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super(message, undefined, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class InvalidOperationError extends BusinessError {
  constructor(message: string) {
    super(message, undefined, 'INVALID_OPERATION', 422);
    this.name = 'InvalidOperationError';
  }
}

export class RateLimitError extends BusinessError {
  constructor(message = 'Rate limit exceeded') {
    super(message, undefined, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}