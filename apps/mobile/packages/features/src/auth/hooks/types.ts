/**
 * Type definitions for auth hooks
 */
import type { UnifiedUser, UnifiedAuthResponse, Role } from '@repo/shared/types';
import type { AuthState, AuthActions } from '@repo/features/auth/store/auth.store';

/**
 * Complete auth hook return type
 */
export interface UseAuthReturn extends AuthState, Omit<AuthActions, 'getAuthService'> {
  authService: any; // UnifiedAuthService type
}

/**
 * Auth guard return type
 */
export interface UseAuthGuardReturn {
  isAuthorized: boolean;
  isLoading: boolean;
  hasPermission: () => boolean;
  user: UnifiedUser | null;
  isAuthenticated: boolean;
}

/**
 * Auth form return type
 */
export interface UseAuthFormReturn {
  handleLogin: (formData: any) => Promise<any>;
  handleRegister: (formData: any) => Promise<any>;
  validationErrors: Record<string, string>;
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  loginError: string | null;
  registerError: string | null;
  clearErrors: () => void;
}

/**
 * Mobile auth specific properties
 */
export interface MobileAuthProperties {
  netInfo: any;
  isOffline: boolean;
  canRefresh: boolean;
  biometricLogin?: () => Promise<boolean>;
  checkBiometricAvailability?: () => Promise<any>;
}

/**
 * Web auth specific properties
 */
export interface WebAuthProperties {
  session: any;
  status: string;
  signIn: any;
  signOut: any;
}