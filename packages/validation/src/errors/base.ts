export enum ErrorCode {
  // Validation errors (400-409)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  
  // Rate limiting (429)
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Business logic errors (422)
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  
  // Server errors (500+)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export interface ErrorContext {
  [key: string]: any;
}

export interface SerializedError {
  name: string;
  message: string;
  code: ErrorCode;
  statusCode: number;
  context?: ErrorContext;
  timestamp: Date;
  stack?: string;
  requestId?: string;
}

export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational = true,
    context?: ErrorContext
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
  
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
  
  withContext(context: ErrorContext): this {
    Object.assign(this.context || {}, context);
    return this;
  }
  
  withRequestId(requestId: string): this {
    (this as any).requestId = requestId;
    return this;
  }
}