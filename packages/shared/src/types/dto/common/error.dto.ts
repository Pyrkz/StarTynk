export interface BaseErrorDTO {
  message: string;
  code: string;
  timestamp: string;
}

export interface ApiErrorDTO extends BaseErrorDTO {
  statusCode: number;
  path?: string;
  method?: string;
  correlationId?: string;
}

export interface BusinessErrorDTO extends BaseErrorDTO {
  type: 'validation' | 'business' | 'authorization' | 'not_found' | 'conflict';
  details?: Record<string, any>;
}

export interface SystemErrorDTO extends BaseErrorDTO {
  type: 'database' | 'network' | 'internal' | 'timeout' | 'rate_limit';
  retryable: boolean;
  retryAfter?: number;
}

export interface FieldErrorDTO {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationErrorResponseDTO extends ApiErrorDTO {
  errors: FieldErrorDTO[];
}

export class ErrorCodes {
  // Authentication errors
  static readonly AUTH_INVALID_CREDENTIALS = 'AUTH001';
  static readonly AUTH_TOKEN_EXPIRED = 'AUTH002';
  static readonly AUTH_TOKEN_INVALID = 'AUTH003';
  static readonly AUTH_UNAUTHORIZED = 'AUTH004';
  static readonly AUTH_SESSION_EXPIRED = 'AUTH005';
  
  // Validation errors
  static readonly VALIDATION_FAILED = 'VAL001';
  static readonly VALIDATION_REQUIRED_FIELD = 'VAL002';
  static readonly VALIDATION_INVALID_FORMAT = 'VAL003';
  static readonly VALIDATION_OUT_OF_RANGE = 'VAL004';
  
  // Business logic errors
  static readonly BUSINESS_RULE_VIOLATION = 'BIZ001';
  static readonly INSUFFICIENT_PERMISSIONS = 'BIZ002';
  static readonly RESOURCE_NOT_FOUND = 'BIZ003';
  static readonly RESOURCE_ALREADY_EXISTS = 'BIZ004';
  static readonly OPERATION_NOT_ALLOWED = 'BIZ005';
  
  // System errors
  static readonly INTERNAL_SERVER_ERROR = 'SYS001';
  static readonly DATABASE_ERROR = 'SYS002';
  static readonly EXTERNAL_SERVICE_ERROR = 'SYS003';
  static readonly TIMEOUT_ERROR = 'SYS004';
  static readonly RATE_LIMIT_EXCEEDED = 'SYS005';
}