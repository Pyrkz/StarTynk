import { z } from 'zod';

/**
 * Polish NIP (Tax Identification Number) validator
 */
export const nipValidator = z.string()
  .min(1, 'NIP is required')
  .refine(
    (nip) => {
      // Remove any non-digits
      const cleanNip = nip.replace(/\D/g, '');
      
      // Check if it has exactly 10 digits
      if (cleanNip.length !== 10) return false;
      
      // NIP checksum validation
      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      let sum = 0;
      
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanNip[i]) * weights[i];
      }
      
      const checksum = sum % 11;
      const lastDigit = parseInt(cleanNip[9]);
      
      return checksum === 10 ? lastDigit === 0 : checksum === lastDigit;
    },
    'Please enter a valid NIP number'
  )
  .transform((nip) => {
    // Format NIP with dashes: XXX-XXX-XX-XX
    const cleanNip = nip.replace(/\D/g, '');
    return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3, 6)}-${cleanNip.slice(6, 8)}-${cleanNip.slice(8, 10)}`;
  });

export const nipValidatorOptional = nipValidator.optional();