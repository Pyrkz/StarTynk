/**
 * String utility functions for consistent string manipulation
 */

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert string to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

/**
 * Convert string to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
};

/**
 * Convert string to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-');
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

/**
 * Remove diacritics from Polish text
 */
export const removeDiacritics = (str: string): string => {
  const diacriticsMap: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
    'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  
  return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => diacriticsMap[char] || char);
};

/**
 * Generate slug from string (URL-friendly)
 */
export const slugify = (str: string): string => {
  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Extract initials from full name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Mask email for privacy
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number for privacy
 */
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-2);
  const middle = '*'.repeat(cleaned.length - 5);
  
  return `${start}${middle}${end}`;
};

/**
 * Format phone number (Polish format)
 */
export const formatPhonePL = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 9) {
    // Polish mobile: XXX XXX XXX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (cleaned.length === 11 && cleaned.startsWith('48')) {
    // International Polish: +48 XXX XXX XXX
    const local = cleaned.slice(2);
    return `+48 ${local.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
  }
  
  return phone;
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Check if string contains only Polish letters
 */
export const isPolishText = (str: string): boolean => {
  return /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/.test(str);
};

/**
 * Count words in string
 */
export const countWords = (str: string): number => {
  return str.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (str: string): boolean => {
  return str.trim().length === 0;
};

/**
 * Remove extra whitespace
 */
export const normalizeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};