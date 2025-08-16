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

// Storage implementations
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

// Platform-specific factory functions
import { UnifiedAuthService } from './services/auth.service';
import { WebAuthStorage } from './storage/web-storage';
import { MobileAuthStorage } from './storage/mobile-storage';

/**
 * Create auth service for web platform
 */
export function createWebAuthService(apiBaseUrl?: string): UnifiedAuthService {
  return new UnifiedAuthService(new WebAuthStorage(), apiBaseUrl);
}

/**
 * Create auth service for mobile platform
 */
export function createMobileAuthService(apiBaseUrl?: string): UnifiedAuthService {
  return new UnifiedAuthService(new MobileAuthStorage(), apiBaseUrl);
}

/**
 * Auto-detect platform and create appropriate auth service
 */
export function createAuthService(apiBaseUrl?: string): UnifiedAuthService {
  if (typeof window !== 'undefined' && !('expo' in (globalThis as any))) {
    return createWebAuthService(apiBaseUrl);
  } else {
    return createMobileAuthService(apiBaseUrl);
  }
}

// Default export
export const authService = createAuthService();