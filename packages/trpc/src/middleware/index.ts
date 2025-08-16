// Authentication and authorization
export {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireModeratorOrAdmin,
  requireCoordinatorOrAbove,
  requireSelfOrAdmin,
  requireProjectAccess,
  rateLimitMiddleware,
  auditMiddleware,
} from './auth';

// Validation and sanitization
export {
  validationMiddleware,
  enhancedValidationMiddleware,
  sanitizationMiddleware,
  commonSchemas,
  fileUploadSchema,
  bulkOperationSchema,
  searchFilterSchema,
  dateRangeSchema,
  addressSchema,
  geolocationSchema,
  moneySchema,
} from './validation';

// Performance and monitoring
export {
  cacheMiddleware,
  transactionMiddleware,
  performanceMiddleware,
  timeoutMiddleware,
  requestSizeLimitMiddleware,
  concurrencyLimitMiddleware,
  healthCheckMiddleware,
} from './performance';

// Legacy exports for backward compatibility
export { rateLimitMiddleware as rateLimitMiddleware_legacy } from './auth';
export { cacheMiddleware as cacheMiddleware_legacy } from './performance';
export { transactionMiddleware as transactionMiddleware_legacy } from './performance';