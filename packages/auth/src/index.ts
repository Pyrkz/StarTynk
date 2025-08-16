// Configuration
export * from './config';

// Types
export * from './types';

// Utilities
export * from './utils';

// Services
export * from './services';

// Providers
export * from './providers';

// Middleware
export * from './middleware';

// Jobs
export * from './jobs/cleanup.job';
export * from './jobs/token-cleanup.job';

// Re-export commonly used functions for convenience
export {
  authenticateRequest,
  withAuth,
  withOptionalAuth,
  withRoleAuth,
  withAdminAuth,
  withCoordinatorAuth,
} from './middleware/auth.middleware';

export {
  detectClientType,
  extractBearerToken,
  extractBearerTokenFromRequest,
  isMobileClient,
  isWebClient,
} from './middleware/client-detector';

export {
  validateCredentials,
  generateAuthResponse,
  findUserByIdentifier,
  getUserById,
  getSanitizedUser,
} from './services/user.service';

export {
  createTokens,
  verifyAccessToken,
  verifyRefreshToken,
  getUserFromAccessToken,
} from './services/token.service';

export {
  rotateRefreshToken,
  cleanupExpiredTokens,
  revokeAllUserTokens,
  getUserActiveDevices,
} from './services/refresh.service';

export {
  hashPassword,
  comparePassword,
  validatePassword,
  generateSecurePassword,
} from './utils/password.utils';

export {
  generateSecureToken,
  sanitizeUser,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  detectLoginMethod,
} from './utils/security.utils';