// Core infrastructure
export * from './repositories';
export * from './services';
export * from './errors';
export * from './events';
export * from './transactions';

// Auth feature - export auth services and stores
export { authService } from './auth/services/auth.service';
export { tokenService } from './auth/services/token.service';
export type { TokenStorage } from './auth/services/token.service';
export { useAuth } from './auth/hooks/useAuth.shared';
export type { UseAuthOptions } from './auth/hooks/useAuth.shared';
export { usePermissions } from './auth/hooks/usePermissions';
export { useAuthForm } from './auth';
export { authStore } from './auth/stores/auth.store';
export type { AuthState } from './auth/stores/auth.store';
// Auth store exports for compatibility
export { useAuthStore, useAuthUser, useIsAuthenticated, useAuthLoading, useAuthErrors } from './auth/store/auth.store';
export type { AuthStore, AuthActions, AuthState as UnifiedAuthState } from './auth/store/auth.store';
// Auth utils
export * from './auth/utils/auth.validators';
export * from './auth/utils/auth.helpers';

// Users feature - explicit exports to avoid conflicts
export { usersService } from './users/services/users.service';
export { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useInviteUser, 
  useResendInvitation 
} from './users/hooks';
// Rename conflicting useUser export
export { useUser as useUserProfile } from './users/hooks';

// Projects feature
export * from './projects';

// Shared utilities and hooks - explicit exports to avoid conflicts
export { useApi, usePagination, useDebounce, useDebouncedCallback, useLocalStorage } from './shared/hooks';
export * from './shared/utils';

// Shared API hooks - rename to avoid conflicts
export { 
  useApiQuery, 
  useUserUpdate,
  useUser as useCurrentUser 
} from './shared/hooks/useApiQuery';
// Rename conflicting useApiMutation export
export { useApiMutation as useSharedApiMutation } from './shared/hooks/useApiQuery';

// Platform-specific auth exports with different names to avoid conflicts
export { useWebAuth } from './auth/hooks/web/useWebAuth';
export { useMobileAuth } from './auth/hooks/mobile/useMobileAuth';

// Re-export types and utilities
export type { FindManyOptions, PaginationOptions, SearchOptions } from './repositories/base';
export type { EventName, EventPayload } from './events';
export type { TransactionOptions } from './transactions';