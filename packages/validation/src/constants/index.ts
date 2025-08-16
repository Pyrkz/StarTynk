// Validation constants and limits
export const VALIDATION_LIMITS = {
  // String lengths
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  DESCRIPTION_MAX: 2000,
  NOTES_MAX: 500,
  
  // Numbers
  MONEY_MAX: 999999999.99,
  PERCENTAGE_MAX: 100,
  HOURS_MAX: 999,
  OVERTIME_MAX: 8,
  
  // Arrays
  ASSIGNEES_MIN: 1,
  FILES_MAX: 10,
  TAGS_MAX: 10,
  CHECKLIST_MAX: 20,
  
  // File sizes (in bytes)
  FILE_SIZE_MAX: 10 * 1024 * 1024, // 10MB
  IMAGE_SIZE_MAX: 5 * 1024 * 1024, // 5MB
  DOCUMENT_SIZE_MAX: 20 * 1024 * 1024, // 20MB
  TOTAL_UPLOAD_SIZE_MAX: 50 * 1024 * 1024, // 50MB
  
  // Dates
  WORK_DATE_PAST_YEARS: 10,
  WORK_DATE_FUTURE_YEARS: 5,
  MIN_AGE: 18,
  MAX_AGE: 100,
  
  // Business hours
  BUSINESS_START_HOUR: 5, // 5 AM
  BUSINESS_END_HOUR: 20, // 8 PM
  MAX_SHIFT_HOURS: 16,
  
  // Geolocation
  GPS_ACCURACY_MAX: 100, // meters
  GEOFENCE_RADIUS_MIN: 10, // meters
  GEOFENCE_RADIUS_MAX: 5000, // meters
  
  // Pagination
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
  
  // Batch operations
  BATCH_SIZE_MAX: 100,
  BULK_UPLOAD_MAX: 500,
} as const;

// Regular expressions
export const VALIDATION_REGEX = {
  // Names (including Polish characters)
  NAME: /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-']+$/,
  PROJECT_NAME: /^[a-zA-Z0-9\s\-_.]+$/,
  
  // Polish specific
  POLISH_PHONE: /^(?:\+48|48)?[\s-]?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})$/,
  POLISH_POSTAL_CODE: /^\d{2}-\d{3}$/,
  POLISH_REGISTRATION: /^[A-Z]{2,3}\s?\d{4,5}[A-Z]{0,2}$/,
  POLISH_PESEL: /^\d{11}$/,
  POLISH_NIP: /^\d{10}$/,
  
  // Time
  TIME_24H: /^([01]\d|2[0-3]):[0-5]\d$/,
  
  // Files
  SAFE_FILENAME: /^[^<>:"/\\|?*]+$/,
  
  // Security
  NO_SCRIPT_TAGS: /<script[^>]*>|<\/script>/gi,
  NO_SQL_INJECTION: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
  
  // Identifiers
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  VIN: /^[A-HJ-NPR-Z0-9]{17}$/,
  
  // Tax codes
  TAX_CODE: /^[A-Z]{2,3}$/,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Required fields
  REQUIRED: 'This field is required',
  
  // String validation
  TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  TOO_LONG: (max: number) => `Must be less than ${max} characters`,
  INVALID_FORMAT: 'Invalid format',
  
  // Number validation
  TOO_SMALL: (min: number) => `Must be at least ${min}`,
  TOO_LARGE: (max: number) => `Must be at most ${max}`,
  NOT_INTEGER: 'Must be a whole number',
  NEGATIVE: 'Cannot be negative',
  
  // Date validation
  INVALID_DATE: 'Invalid date',
  DATE_IN_PAST: 'Date must be in the past',
  DATE_IN_FUTURE: 'Date must be in the future',
  DATE_RANGE: 'End date must be after start date',
  
  // Email/Phone
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  
  // Password
  PASSWORD_WEAK: 'Password is too weak',
  PASSWORD_COMMON: 'Password is too common',
  PASSWORD_MISMATCH: 'Passwords do not match',
  
  // File validation
  FILE_TOO_LARGE: (maxMB: number) => `File must be smaller than ${maxMB}MB`,
  FILE_TYPE_NOT_ALLOWED: 'File type not allowed',
  
  // Business logic
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'This already exists',
  INVALID_STATE: 'Invalid state transition',
  
  // Location
  LOCATION_REQUIRED: 'Location is required',
  OUTSIDE_WORK_AREA: 'Outside allowed work area',
  GPS_ACCURACY_LOW: 'GPS accuracy is too low',
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ALL: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// Default values
export const VALIDATION_DEFAULTS = {
  PAGINATION: {
    page: 1,
    limit: VALIDATION_LIMITS.PAGE_SIZE_DEFAULT,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  },
  
  MONEY: {
    currency: 'PLN',
    precision: 2,
  },
  
  LOCATION: {
    country: 'PL',
    accuracy: 50, // meters
  },
  
  WORK_HOURS: {
    regularHours: 8,
    breakMinutes: 30,
    overtimeMultiplier: 1.5,
    weekendMultiplier: 2,
    holidayMultiplier: 2.5,
  },
} as const;