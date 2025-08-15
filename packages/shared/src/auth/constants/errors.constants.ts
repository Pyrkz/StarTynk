export enum AuthErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'AUTH001',
  TOKEN_EXPIRED = 'AUTH002',
  TOKEN_INVALID = 'AUTH003',
  REFRESH_TOKEN_EXPIRED = 'AUTH004',
  REFRESH_TOKEN_REUSED = 'AUTH005', // Possible token theft
  SESSION_EXPIRED = 'AUTH006',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'AUTH007',
  ACCOUNT_LOCKED = 'AUTH008',
  ACCOUNT_INACTIVE = 'AUTH009',
  
  // 2FA errors
  TWO_FACTOR_REQUIRED = 'AUTH010',
  TWO_FACTOR_INVALID = 'AUTH011',
  
  // Password errors
  PASSWORD_RESET_REQUIRED = 'AUTH012',
  PASSWORD_TOO_WEAK = 'AUTH013',
  PASSWORD_RECENTLY_USED = 'AUTH014',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'AUTH015',
  
  // General errors
  INVALID_AUTH_METHOD = 'AUTH016',
  AUTH_SERVICE_UNAVAILABLE = 'AUTH017',
}

export class AuthError extends Error {
  public readonly timestamp: Date;

  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly statusCode: number = 401,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  // Factory methods for common errors
  static invalidCredentials(): AuthError {
    return new AuthError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email/phone or password',
      401
    );
  }

  static tokenExpired(): AuthError {
    return new AuthError(
      AuthErrorCode.TOKEN_EXPIRED,
      'Access token has expired',
      401
    );
  }

  static tokenInvalid(): AuthError {
    return new AuthError(
      AuthErrorCode.TOKEN_INVALID,
      'Invalid token provided',
      401
    );
  }

  static refreshTokenExpired(): AuthError {
    return new AuthError(
      AuthErrorCode.REFRESH_TOKEN_EXPIRED,
      'Refresh token has expired',
      401
    );
  }

  static refreshTokenReused(): AuthError {
    return new AuthError(
      AuthErrorCode.REFRESH_TOKEN_REUSED,
      'Refresh token has already been used. This may indicate token theft.',
      401
    );
  }

  static sessionExpired(): AuthError {
    return new AuthError(
      AuthErrorCode.SESSION_EXPIRED,
      'Session has expired',
      401
    );
  }

  static insufficientPermissions(required?: string[]): AuthError {
    return new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions to perform this action',
      403,
      { required }
    );
  }

  static accountLocked(until?: Date): AuthError {
    return new AuthError(
      AuthErrorCode.ACCOUNT_LOCKED,
      'Account has been locked due to too many failed attempts',
      403,
      { lockedUntil: until }
    );
  }

  static accountInactive(): AuthError {
    return new AuthError(
      AuthErrorCode.ACCOUNT_INACTIVE,
      'Account is inactive',
      403
    );
  }

  static twoFactorRequired(): AuthError {
    return new AuthError(
      AuthErrorCode.TWO_FACTOR_REQUIRED,
      'Two-factor authentication is required',
      403
    );
  }

  static twoFactorInvalid(): AuthError {
    return new AuthError(
      AuthErrorCode.TWO_FACTOR_INVALID,
      'Invalid two-factor authentication code',
      401
    );
  }

  static passwordResetRequired(): AuthError {
    return new AuthError(
      AuthErrorCode.PASSWORD_RESET_REQUIRED,
      'Password reset is required',
      403
    );
  }

  static passwordTooWeak(requirements?: string[]): AuthError {
    return new AuthError(
      AuthErrorCode.PASSWORD_TOO_WEAK,
      'Password does not meet security requirements',
      400,
      { requirements }
    );
  }

  static rateLimitExceeded(retryAfter?: number): AuthError {
    return new AuthError(
      AuthErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      429,
      { retryAfter }
    );
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}