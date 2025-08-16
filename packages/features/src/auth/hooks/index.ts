// Main auth hooks
export { useAuth } from './useAuth';
export { useAuthGuard } from './useAuthGuard';
export { useAuthForm } from './useAuthForm';
export { usePermissions } from './usePermissions';

// Auth store selectors
export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthErrors,
} from '../store/auth.store';

// Legacy compatibility (temporary)
export { useAuth as useAuthContext } from './useAuth';
export { useAuth as useAuthService } from './useAuth';

// Export existing shared hook temporarily
export { useAuth as useAuthShared } from './useAuth.shared';
export type { UseAuthOptions } from './useAuth.shared';