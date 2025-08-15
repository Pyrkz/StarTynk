import { randomBytes, createHash } from 'crypto';

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate secure random string with custom charset
 */
export function generateSecureString(length: number = 32, charset?: string): string {
  const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const chars = charset || defaultCharset;
  
  const bytes = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Hash sensitive data for logging (non-cryptographic)
 */
export function hashForLogging(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 8);
}

/**
 * Sanitize user object for response (remove sensitive fields)
 */
export function sanitizeUser(user: any): any {
  if (!user) return null;
  
  const { 
    password, 
    deletedAt, 
    refreshTokens,
    accounts,
    sessions,
    ...sanitized 
  } = user;
  
  return sanitized;
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(headers: Record<string, string | undefined>): string | undefined {
  return headers['x-forwarded-for'] || 
         headers['x-real-ip'] || 
         headers['cf-connecting-ip'] ||
         undefined;
}

/**
 * Generate OTP code
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it's between 10-15 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number (remove non-digits, keep leading +)
 */
export function normalizePhone(phone: string): string {
  // Keep only digits and leading +
  const normalized = phone.replace(/[^\d+]/g, '');
  // Ensure + is only at the beginning
  return normalized.replace(/\+/g, '').replace(/^/, normalized.startsWith('+') ? '+' : '');
}

/**
 * Detect login method from identifier
 */
export function detectLoginMethod(identifier: string): 'email' | 'phone' | 'invalid' {
  const normalized = identifier.trim();
  
  if (isValidEmail(normalized)) {
    return 'email';
  }
  
  if (isValidPhone(normalized)) {
    return 'phone';
  }
  
  return 'invalid';
}

/**
 * Rate limiting helper
 */
export function createRateLimitKey(ip: string, identifier?: string): string {
  const base = `rate_limit:${ip}`;
  return identifier ? `${base}:${hashForLogging(identifier)}` : base;
}

/**
 * Check if user agent is from mobile app
 */
export function isMobileApp(userAgent: string, mobileAppIdentifier: string): boolean {
  return userAgent.includes(mobileAppIdentifier) || 
         userAgent.includes('Expo') ||
         userAgent.includes('okhttp'); // React Native's default HTTP client
}