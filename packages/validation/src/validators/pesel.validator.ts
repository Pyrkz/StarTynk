import { z } from 'zod';

/**
 * Polish PESEL (Personal Identification Number) validator
 */
export const peselValidator = z.string()
  .min(1, 'PESEL is required')
  .refine(
    (pesel) => {
      // Remove any non-digits
      const cleanPesel = pesel.replace(/\D/g, '');
      
      // Check if it has exactly 11 digits
      if (cleanPesel.length !== 11) return false;
      
      // PESEL checksum validation
      const weights = [9, 7, 3, 1, 9, 7, 3, 1, 9, 7];
      let sum = 0;
      
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanPesel[i]) * weights[i];
      }
      
      const checksum = sum % 10;
      const lastDigit = parseInt(cleanPesel[10]);
      
      return (10 - checksum) % 10 === lastDigit;
    },
    'Please enter a valid PESEL number'
  )
  .transform((pesel) => {
    // Keep PESEL as digits only
    return pesel.replace(/\D/g, '');
  });

export const peselValidatorOptional = peselValidator.optional();