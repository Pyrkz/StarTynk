import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export const phoneValidator = z.string()
  .min(1, 'Phone number is required')
  .refine(
    (phone) => {
      try {
        // Try parsing with Poland as default country
        const parsed = parsePhoneNumber(phone, 'PL');
        return parsed.isValid();
      } catch {
        // If parsing fails, try without country code
        return isValidPhoneNumber(phone);
      }
    },
    'Please enter a valid phone number'
  )
  .transform((phone) => {
    try {
      // Format the phone number consistently
      const parsed = parsePhoneNumber(phone, 'PL');
      return parsed.formatInternational();
    } catch {
      // If parsing fails, return as is
      return phone;
    }
  });

export const phoneValidatorOptional = phoneValidator.optional();