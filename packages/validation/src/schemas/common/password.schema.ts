import { z } from 'zod';

// Password with entropy check
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine(password => {
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;
    
    return strength >= 3;
  }, 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters')
  .refine(password => {
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    return !commonPasswords.some(common => 
      password.toLowerCase().includes(common)
    );
  }, 'Password is too common')
  .refine(password => {
    // Check for repeated characters
    return !/(.)\1{2,}/.test(password);
  }, 'Password contains too many repeated characters');

// Weak password for temporary use
export const temporaryPasswordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long');

// PIN validation
export const pinSchema = z.string()
  .length(4, 'PIN must be exactly 4 digits')
  .regex(/^\d{4}$/, 'PIN must contain only digits')
  .refine(pin => {
    // Check for sequential numbers
    const digits = pin.split('').map(Number);
    const isSequential = digits.every((d, i) => 
      i === 0 || d === digits[i - 1] + 1 || d === digits[i - 1] - 1
    );
    return !isSequential;
  }, 'PIN cannot be sequential')
  .refine(pin => {
    // Check for repeated digits
    return !/^(\d)\1{3}$/.test(pin);
  }, 'PIN cannot be all the same digit');