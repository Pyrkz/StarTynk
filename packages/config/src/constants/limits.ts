export const API_LIMITS = {
  // Request limits
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_JSON_PAYLOAD: 1024 * 1024, // 1MB
  MAX_FILE_UPLOAD: 100 * 1024 * 1024, // 100MB
  
  // Rate limiting
  DEFAULT_RATE_LIMIT: 100, // requests per window
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Authentication
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // Database
  MAX_QUERY_RESULTS: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  DATABASE_TIMEOUT: 30000, // 30 seconds
  CACHE_TIMEOUT: 5000, // 5 seconds
  EMAIL_TIMEOUT: 10000, // 10 seconds
  
  // Validation
  MAX_STRING_LENGTH: 1000,
  MAX_TEXT_LENGTH: 10000,
  MAX_ARRAY_SIZE: 100,
  
  // File uploads
  MAX_FILES_PER_REQUEST: 10,
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'txt'],
} as const;

export const BUSINESS_LIMITS = {
  // User limits
  MAX_USERS_PER_ORG: 1000,
  MAX_PROJECTS_PER_USER: 100,
  MAX_TASKS_PER_PROJECT: 1000,
  
  // Content limits
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
  MAX_TAGS_PER_ITEM: 10,
  
  // History and logs
  MAX_HISTORY_ENTRIES: 1000,
  LOG_RETENTION_DAYS: 90,
  BACKUP_RETENTION_DAYS: 30,
} as const;

export const PERFORMANCE_LIMITS = {
  // Memory limits
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  MAX_HEAP_SIZE: 1024 * 1024 * 1024, // 1GB
  
  // CPU limits
  MAX_CPU_USAGE_PERCENT: 80,
  MAX_PROCESSING_TIME: 60000, // 60 seconds
  
  // Network limits
  MAX_CONCURRENT_CONNECTIONS: 1000,
  MAX_BANDWIDTH_MBPS: 100,
  
  // Cache limits
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CACHE_ENTRIES: 10000,
  DEFAULT_CACHE_TTL: 3600, // 1 hour
} as const;