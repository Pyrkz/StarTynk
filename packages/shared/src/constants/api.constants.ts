/**
 * API-related constants
 */

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * API endpoint patterns
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET: '/users/:id',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    STATISTICS: '/users/statistics'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: '/projects/:id',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
    STATISTICS: '/projects/statistics'
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    GET: '/tasks/:id',
    UPDATE: '/tasks/:id',
    DELETE: '/tasks/:id',
    BY_PROJECT: '/projects/:projectId/tasks'
  },
  QUALITY: {
    LIST: '/quality-controls',
    CREATE: '/quality-controls',
    GET: '/quality-controls/:id',
    UPDATE: '/quality-controls/:id',
    BY_TASK: '/tasks/:taskId/quality-controls'
  },
  MATERIALS: {
    LIST: '/materials',
    CREATE: '/materials',
    GET: '/materials/:id',
    UPDATE: '/materials/:id',
    DELETE: '/materials/:id',
    CATEGORIES: '/material-categories'
  },
  EQUIPMENT: {
    LIST: '/equipment',
    CREATE: '/equipment',
    GET: '/equipment/:id',
    UPDATE: '/equipment/:id',
    DELETE: '/equipment/:id',
    ASSIGNMENTS: '/equipment-assignments',
    HISTORY: '/equipment/:id/history'
  },
  VEHICLES: {
    LIST: '/vehicles',
    CREATE: '/vehicles',
    GET: '/vehicles/:id',
    UPDATE: '/vehicles/:id',
    DELETE: '/vehicles/:id',
    MAINTENANCE: '/vehicles/:id/maintenance',
    REMINDERS: '/vehicles/:id/reminders'
  },
  UPLOADS: {
    UPLOAD: '/uploads',
    GET: '/uploads/:id',
    DELETE: '/uploads/:id'
  },
  REPORTS: {
    GENERATE: '/reports',
    DOWNLOAD: '/reports/:id/download',
    LIST: '/reports'
  }
} as const;

/**
 * Content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  XML: 'application/xml',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
} as const;

/**
 * Headers
 */
export const HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  X_REQUEST_ID: 'X-Request-ID',
  X_API_KEY: 'X-API-Key',
  X_FORWARDED_FOR: 'X-Forwarded-For',
  USER_AGENT: 'User-Agent'
} as const;

/**
 * Request timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  SHORT: 5000, // 5 seconds
  MEDIUM: 15000, // 15 seconds
  LONG: 30000, // 30 seconds
  UPLOAD: 60000, // 1 minute
  REPORT: 120000 // 2 minutes
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504]
} as const;

/**
 * WebSocket events
 */
export const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  TASK_UPDATED: 'task:updated',
  PROJECT_UPDATED: 'project:updated',
  USER_ACTIVITY: 'user:activity',
  NOTIFICATION: 'notification',
  QUALITY_CONTROL: 'quality:control',
  MATERIAL_DELIVERED: 'material:delivered'
} as const;