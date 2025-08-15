import { z } from 'zod';

export const emailValidator = z.string()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Please enter a valid email address')
  .toLowerCase()
  .refine(
    (email) => {
      // Additional validation for common email issues
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      
      const [local, domain] = parts;
      
      // Local part validation
      if (local.length === 0 || local.length > 64) return false;
      if (local.startsWith('.') || local.endsWith('.')) return false;
      if (local.includes('..')) return false;
      
      // Domain validation
      if (domain.length === 0 || domain.length > 253) return false;
      if (domain.startsWith('-') || domain.endsWith('-')) return false;
      if (!domain.includes('.')) return false;
      
      return true;
    },
    'Please enter a valid email address'
  );