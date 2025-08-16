import { z } from 'zod';

// Email with comprehensive validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .max(255)
  .refine(email => {
    // Additional validation for common typos
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [local, domain] = parts;
    
    // Check for consecutive dots
    if (local.includes('..') || domain.includes('..')) return false;
    
    // Check for valid domain
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    
    // Check TLD length
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 6) return false;
    
    return true;
  }, 'Invalid email format')
  .transform(email => email.toLowerCase().trim());

// Optional email
export const emailOptionalSchema = emailSchema.optional();

// Email array with uniqueness
export const emailArraySchema = z.array(emailSchema)
  .refine(emails => {
    const unique = new Set(emails);
    return unique.size === emails.length;
  }, 'Duplicate emails not allowed');