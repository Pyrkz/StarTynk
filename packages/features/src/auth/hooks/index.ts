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

// Export shared hook types
export type { UseAuthOptions } from './useAuth.shared';