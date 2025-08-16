import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
  // HTML sanitization for rich text
  static sanitizeHTML(input: string, options?: any): string {
    if (!input || typeof input !== 'string') return '';
    
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
      ...options,
    };
    
    return DOMPurify.sanitize(input, config);
  }
  
  // SQL injection prevention (escape special characters)
  static escapeSql(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x00/g, '\\x00')
      .replace(/\x1a/g, '\\x1a');
  }
  
  // File path traversal prevention
  static sanitizePath(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9\-_./]/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\//, ''); // Remove leading slash
  }
  
  // NoSQL injection prevention
  static sanitizeMongoQuery(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      // Remove MongoDB operators
      if (key.startsWith('$')) continue;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = this.sanitizeMongoQuery(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Remove potential operator injections
        cleaned[key] = obj[key].replace(/\$/g, '');
      } else {
        cleaned[key] = obj[key];
      }
    }
    
    return cleaned;
  }
  
  // Command injection prevention
  static sanitizeShellArg(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove dangerous shell characters
    return input.replace(/[;&|`$()<>\\!\n\r]/g, '');
  }
  
  // LDAP injection prevention
  static sanitizeLdap(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const ldapChars: Record<string, string> = {
      '\\': '\\5c',
      '*': '\\2a',
      '(': '\\28',
      ')': '\\29',
      '\0': '\\00',
      '/': '\\2f',
    };
    
    let sanitized = input;
    for (const [char, escape] of Object.entries(ldapChars)) {
      sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), escape);
    }
    
    return sanitized;
  }
  
  // Remove sensitive data from logs
  static sanitizeForLogging(obj: any, depth = 0): any {
    if (depth > 10) return '[DEPTH_LIMIT_EXCEEDED]'; // Prevent infinite recursion
    
    const sensitiveKeys = [
      'password', 'token', 'secret', 'apiKey', 'apiSecret',
      'creditCard', 'ssn', 'pin', 'cvv', 'accountNumber',
      'privateKey', 'passphrase', 'authorization', 'sessionId',
    ];
    
    const sensitivePatterns = [
      /^.*(password|token|secret|key).*$/i,
      /^.*(credit|debit).*card.*$/i,
      /^.*ssn.*$/i,
    ];
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const cleaned: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      
      // Check if key matches sensitive patterns
      const isSensitive = sensitiveKeys.includes(lowerKey) ||
        sensitivePatterns.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = this.sanitizeForLogging(obj[key], depth + 1);
      } else if (typeof obj[key] === 'string' && obj[key].length > 1000) {
        // Truncate very long strings
        cleaned[key] = obj[key].substring(0, 1000) + '... [TRUNCATED]';
      } else {
        cleaned[key] = obj[key];
      }
    }
    
    return cleaned;
  }
  
  // Email sanitization
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._\-+]/g, '');
  }
  
  // Phone number sanitization
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    // Keep only digits, +, -, and spaces
    return phone.replace(/[^0-9+\-\s]/g, '').trim();
  }
  
  // Generic string sanitization
  static sanitizeString(input: string, maxLength = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }
}

// Export convenience functions
export const sanitize = {
  html: Sanitizer.sanitizeHTML,
  sql: Sanitizer.escapeSql,
  path: Sanitizer.sanitizePath,
  mongo: Sanitizer.sanitizeMongoQuery,
  shell: Sanitizer.sanitizeShellArg,
  ldap: Sanitizer.sanitizeLdap,
  log: Sanitizer.sanitizeForLogging,
  email: Sanitizer.sanitizeEmail,
  phone: Sanitizer.sanitizePhone,
  string: Sanitizer.sanitizeString,
};

// Sanitization middleware helper
export function sanitizeObject(obj: any, options?: {
  deep?: boolean;
  html?: boolean;
  sql?: boolean;
  maxDepth?: number;
}): any {
  const { deep = true, html = true, sql = false, maxDepth = 10 } = options || {};
  
  function sanitizeValue(value: any, depth = 0): any {
    if (depth > maxDepth) return value;
    
    if (typeof value === 'string') {
      let sanitized = value;
      if (html) sanitized = Sanitizer.sanitizeHTML(sanitized);
      if (sql) sanitized = Sanitizer.escapeSql(sanitized);
      return sanitized;
    }
    
    if (deep && typeof value === 'object' && value !== null) {
      const result: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        result[key] = sanitizeValue(value[key], depth + 1);
      }
      return result;
    }
    
    return value;
  }
  
  return sanitizeValue(obj);
}