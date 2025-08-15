/**
 * Security utilities and configurations for the application
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The user input to sanitize
 * @returns Sanitized string safe for rendering
 */
export function sanitizeInput(input: string): string {
  // Basic HTML entity encoding
  const htmlEntities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '&': '&amp;',
  }
  
  return input.replace(/[<>"'/&]/g, (char) => htmlEntities[char] || char)
}

/**
 * Validate URL to prevent open redirect attacks
 * @param url - The URL to validate
 * @param allowedDomains - List of allowed domains
 * @returns true if URL is safe, false otherwise
 */
export function isValidRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    
    // Check if it's a relative URL (same origin)
    if (parsedUrl.origin === window.location.origin) {
      return true
    }
    
    // Check against allowed domains
    return allowedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    )
  } catch {
    // Invalid URL
    return false
  }
}

/**
 * Content Security Policy configuration
 * Should be implemented in middleware or headers
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Consider removing unsafe-inline in production
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

/**
 * Security headers configuration
 * Should be implemented in next.config.js or middleware
 */
export const SECURITY_HEADERS = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

/**
 * Rate limiting configuration
 * Should be implemented with a proper rate limiting library
 */
export const RATE_LIMITS = {
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  }
}

/**
 * CSRF token validation
 * This is a simplified version - use a proper CSRF library in production
 */
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length > 0
}