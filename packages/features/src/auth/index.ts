// Services
export { authService } from './services/auth.service';
export { tokenService } from './services/token.service';
export type { TokenStorage } from './services/token.service';

// Hooks
export { useAuth } from './hooks/useAuth.shared';
export type { UseAuthOptions } from './hooks/useAuth.shared';
export { usePermissions } from './hooks/usePermissions';

// Additional exports for mobile compatibility
export { useAuth as useMobileAuth } from './hooks/useAuth.shared';

// Form hooks (placeholder for form management)
export const useAuthForm = () => ({
  // Form state management placeholder
  isValid: true,
  errors: {},
  touched: {},
  handleSubmit: (callback: Function) => callback,
  resetForm: () => {},
  setFieldValue: () => {},
  setFieldTouched: () => {},
});

// Stores
export { authStore } from './stores/auth.store';
export type { AuthState } from './stores/auth.store';
// Mobile storage setter
export { setMobileStorage } from './stores/auth.store.mobile';
// Also export from store path for compatibility
export { useAuthStore, useAuthUser, useIsAuthenticated, useAuthLoading, useAuthErrors } from './store/auth.store';
export type { AuthStore, AuthActions, AuthState as UnifiedAuthState } from './store/auth.store';

// Utils
export * from './utils/auth.validators';
export * from './utils/auth.helpers';