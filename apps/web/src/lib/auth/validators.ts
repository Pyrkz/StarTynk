/**
 * Auth validation utilities for email and phone login
 */

/**
 * Detects whether the identifier is an email or phone number
 */
export function detectLoginMethod(identifier: string): 'email' | 'phone' | 'invalid' {
  const trimmed = identifier.trim();
  
  // Email regex check
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'email';
  }
  
  // Phone regex (international format support)
  // Accepts: +1234567890, 001234567890, 1234567890, +48 123 456 789
  if (/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$/.test(trimmed)) {
    return 'phone';
  }
  
  return 'invalid';
}

/**
 * Normalizes phone number by removing all non-numeric characters except leading +
 */
export function normalizePhone(phone: string): string {
  // Keep the + if it's at the beginning, remove all other non-digits
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalizes email to lowercase and trimmed
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates phone format
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Must be between 10 and 15 digits (with optional +)
  const digitCount = normalized.replace(/^\+/, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Masks phone number for display
 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length < 4) return normalized;
  
  // Show first 2 and last 2 digits
  const firstTwo = normalized.slice(0, 2);
  const lastTwo = normalized.slice(-2);
  const masked = '*'.repeat(normalized.length - 4);
  
  return `${firstTwo}${masked}${lastTwo}`;
}

/**
 * Masks email for display
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const visibleChars = Math.min(2, Math.floor(localPart.length / 2));
  const firstChars = localPart.slice(0, visibleChars);
  const masked = '*'.repeat(localPart.length - visibleChars);
  
  return `${firstChars}${masked}@${domain}`;
}