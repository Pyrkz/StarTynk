export const REGEX_PATTERNS = {
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Password validation
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PASSWORD_MEDIUM: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]/,
  PASSWORD_BASIC: /^[A-Za-z\d@$!%*?&]/,
  
  // Phone number validation
  PHONE_INTERNATIONAL: /^\+[1-9]\d{1,14}$/,
  PHONE_US: /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/,
  PHONE_BASIC: /^[\d\s\-\+\(\)]+$/,
  
  // URL validation
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/,
  URL_SECURE: /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/,
  
  // Username validation
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  USERNAME_ALPHANUMERIC: /^[a-zA-Z0-9]{3,20}$/,
  
  // Name validation
  NAME: /^[a-zA-Z\s\-']{1,50}$/,
  FULL_NAME: /^[a-zA-Z\s\-']{2,100}$/,
  
  // ID validation
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  NANOID: /^[A-Za-z0-9_-]{21}$/,
  
  // File validation
  FILE_NAME: /^[a-zA-Z0-9._-]{1,255}$/,
  IMAGE_EXTENSION: /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
  DOCUMENT_EXTENSION: /\.(pdf|doc|docx|txt|rtf)$/i,
  
  // Database validation
  TABLE_NAME: /^[a-zA-Z][a-zA-Z0-9_]{0,62}$/,
  COLUMN_NAME: /^[a-zA-Z][a-zA-Z0-9_]{0,62}$/,
  
  // API validation
  API_VERSION: /^v[1-9]\d*$/,
  API_KEY: /^[a-zA-Z0-9]{32,64}$/,
  
  // Common formats
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
  
  // Network validation
  IP_V4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IP_V6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  
  // Social media
  TWITTER_HANDLE: /^@[a-zA-Z0-9_]{1,15}$/,
  HASHTAG: /^#[a-zA-Z0-9_]{1,100}$/,
  
  // Financial
  CREDIT_CARD: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  CURRENCY_AMOUNT: /^\d+(?:\.\d{1,2})?$/,
  
  // Code validation
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  CSS_CLASS: /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/,
  
  // Security
  JWT_TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
  HASH_SHA256: /^[a-f0-9]{64}$/i,
  HASH_MD5: /^[a-f0-9]{32}$/i,
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_WEAK: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
  PHONE_INVALID: 'Please enter a valid phone number',
  URL_INVALID: 'Please enter a valid URL',
  USERNAME_INVALID: 'Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens',
  NAME_INVALID: 'Name must contain only letters, spaces, hyphens, and apostrophes',
  REQUIRED_FIELD: 'This field is required',
  MIN_LENGTH: 'Must be at least {min} characters long',
  MAX_LENGTH: 'Must be no more than {max} characters long',
  NUMERIC_ONLY: 'Must contain only numbers',
  ALPHANUMERIC_ONLY: 'Must contain only letters and numbers',
} as const;