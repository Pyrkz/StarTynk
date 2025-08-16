import { z } from 'zod';

// Polish phone number validation
const POLISH_PHONE_REGEX = /^(?:\+48|48)?[\s-]?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})$/;

// International phone with libphonenumber-js would be better but keeping it simple for now
export const phoneSchema = z.string()
  .trim()
  .refine(phone => {
    // Remove all non-digits for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Polish numbers
    if (phone.startsWith('+48') || phone.startsWith('48') || digitsOnly.length === 9) {
      return POLISH_PHONE_REGEX.test(phone);
    }
    
    // International numbers (basic validation)
    if (phone.startsWith('+')) {
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }
    
    return false;
  }, 'Invalid phone number')
  .transform(phone => {
    // Normalize Polish numbers
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 9) {
      return `+48${digitsOnly}`;
    }
    if (digitsOnly.startsWith('48') && digitsOnly.length === 11) {
      return `+${digitsOnly}`;
    }
    return phone;
  });

// Optional phone
export const phoneOptionalSchema = phoneSchema.optional();

// Phone array
export const phoneArraySchema = z.array(phoneSchema);