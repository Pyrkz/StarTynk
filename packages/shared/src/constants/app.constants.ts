/**
 * Application-wide constants
 */

export const APP_NAME = 'StarTynk';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Construction Project Management System';

/**
 * Default pagination settings
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_CURSOR_SIZE: 50
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_IMAGE: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_DOCUMENT: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD.MM.YYYY',
  DISPLAY_WITH_TIME: 'DD.MM.YYYY HH:mm',
  TIME_ONLY: 'HH:mm',
  MONTH_YEAR: 'MM/YYYY',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
} as const;

/**
 * Validation constraints
 */
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  PHONE: {
    MIN_LENGTH: 9,
    MAX_LENGTH: 15
  },
  ADDRESS: {
    MAX_LENGTH: 500
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000
  },
  NOTES: {
    MAX_LENGTH: 1000
  }
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  VERY_SHORT: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  STATIC: 604800 // 1 week
} as const;

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5 // 5 login attempts per window
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100 // 100 requests per window
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 50 // 50 uploads per hour
  }
} as const;

/**
 * Default values for project management
 */
export const DEFAULTS = {
  TASK: {
    PRIORITY: 'MEDIUM',
    STATUS: 'NEW',
    ESTIMATED_HOURS: 8
  },
  PROJECT: {
    STATUS: 'PLANNING',
    BASE_RATE: 50.0
  },
  QUALITY_CONTROL: {
    STATUS: 'PENDING',
    COMPLETION_RATE: 0,
    CONTROL_NUMBER: 1
  }
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  ENABLE_FILE_UPLOAD: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_EXPORT: true,
  ENABLE_REPORTING: true,
  ENABLE_MOBILE_APP: true
} as const;