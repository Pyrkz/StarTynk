/**
 * Authentication configuration and environment validation
 */

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  sessionSecret: string;
  tokenExpiry: string;
  refreshExpiry: string;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  otpLength: number;
  otpExpiry: number;
  sessionCookieName: string;
  mobileAppIdentifier: string;
  allowedOrigins: string[];
}

/**
 * Get authentication configuration from environment variables
 */
export function getAuthConfig(): AuthConfig {
  return {
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    sessionSecret: process.env.NEXTAUTH_SECRET!,
    tokenExpiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_EXPIRY || '30d',
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION || '900000'), // 15 minutes
    otpLength: parseInt(process.env.OTP_LENGTH || '6'),
    otpExpiry: parseInt(process.env.OTP_EXPIRY || '600000'), // 10 minutes
    sessionCookieName: process.env.SESSION_COOKIE_NAME || '__session',
    mobileAppIdentifier: process.env.MOBILE_APP_IDENTIFIER || 'com.startynk.mobile',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  const errors: string[] = [];
  
  if (!config.jwtSecret) {
    errors.push('JWT_SECRET is required');
  }
  
  if (!config.sessionSecret) {
    errors.push('NEXTAUTH_SECRET is required');
  }
  
  if (config.passwordMinLength < 6) {
    errors.push('PASSWORD_MIN_LENGTH must be at least 6');
  }
  
  if (config.maxLoginAttempts < 1) {
    errors.push('MAX_LOGIN_ATTEMPTS must be at least 1');
  }
  
  if (errors.length > 0) {
    throw new Error(`Authentication configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Security headers for auth endpoints
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
} as const;

/**
 * Get CORS headers for a specific origin
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const config = getAuthConfig();
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Type, X-Device-Id',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  if (origin && config.allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
}