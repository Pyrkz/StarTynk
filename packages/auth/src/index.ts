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

// Legacy storage implementations (deprecated - use @repo/shared storage instead)
export { AuthStorage } from './storage/storage.interface';
export { WebAuthStorage } from './storage/web-storage';
export { MobileAuthStorage } from './storage/mobile-storage';

// Main unified auth service
export { UnifiedAuthService } from './services/auth.service';

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
  refreshAccessToken,
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

// Export PasswordUtils namespace for compatibility
import * as passwordUtils from './utils/password.utils';
export const PasswordUtils = {
  hash: passwordUtils.hashPassword,
  verify: passwordUtils.comparePassword,
  validate: passwordUtils.validatePassword,
  generate: passwordUtils.generateSecurePassword,
};

export {
  generateSecureToken,
  sanitizeUser,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  detectLoginMethod,
} from './utils/security.utils';

// Platform-specific factory functions
import { UnifiedAuthService } from './services/auth.service';
import { authStorage } from '@repo/shared';
import type { StorageConfig, UnifiedStorage } from '@repo/shared';

/**
 * Create auth service with custom storage
 */
export function createAuthServiceWithStorage(storage: UnifiedStorage, apiBaseUrl?: string): UnifiedAuthService {
  return new UnifiedAuthService(storage, apiBaseUrl);
}

/**
 * Create auth service for web platform
 */
export function createWebAuthService(apiBaseUrl?: string, config?: StorageConfig): UnifiedAuthService {
  // For web, we can use the default authStorage which uses WebStorage internally
  if (config) {
    const { WebStorage } = require('@repo/shared');
    return new UnifiedAuthService(new WebStorage(config), apiBaseUrl);
  }
  return new UnifiedAuthService(authStorage, apiBaseUrl);
}

/**
 * Create auth service for mobile platform
 */
export function createMobileAuthService(apiBaseUrl?: string, config?: StorageConfig): UnifiedAuthService {
  // For mobile, use default authStorage which will be MobileStorage when in mobile environment
  // The shared package handles platform detection internally
  return new UnifiedAuthService(authStorage, apiBaseUrl);
}

/**
 * Auto-detect platform and create appropriate auth service
 */
export function createAuthService(apiBaseUrl?: string, config?: StorageConfig): UnifiedAuthService {
  if (typeof window !== 'undefined' && !('expo' in (globalThis as any))) {
    return createWebAuthService(apiBaseUrl, config);
  } else {
    return createMobileAuthService(apiBaseUrl, config);
  }
}

// Default export
export const authService = createAuthService();