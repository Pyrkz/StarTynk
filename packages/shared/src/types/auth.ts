import { Role } from '@repo/database';

/**
 * Unified user interface for both web and mobile platforms
 * Consolidates all user-related fields from previous implementations
 */
export interface UnifiedUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Mobile-specific fields (optional for backward compatibility)
  firstName?: string;  // Derived from name for mobile
  lastName?: string;   // Derived from name for mobile
  avatar?: string | null;
  // Web-specific fields
  image?: string | null; // NextAuth compatibility
  // Additional fields from database
  position?: string | null;
  department?: string | null;
  lastLoginAt?: string | null;
  loginCount?: number;
}

/**
 * Unified authentication response for login/register
 * Works for both session-based (web) and JWT-based (mobile) auth
 */
export interface UnifiedAuthResponse {
  success: boolean;
  user?: UnifiedUser;
  // JWT fields (mobile)
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  // Session fields (web)  
  sessionId?: string;
  redirectUrl?: string;
  // Error handling
  error?: string;
  message?: string;
}

/**
 * Unified login request interface
 * Supports both email and phone authentication
 */
export interface LoginRequest {
  identifier: string; // email or phone number
  password: string;
  loginMethod: 'email' | 'phone';
  deviceId?: string;    // Required for mobile
  rememberMe?: boolean;
  // Platform detection
  clientType?: 'web' | 'mobile';
}

/**
 * Registration request interface
 */
export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  name: string;
  loginMethod: 'email' | 'phone';
  deviceId?: string;
  clientType?: 'web' | 'mobile';
}

/**
 * Token refresh request (mobile only)
 */
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

/**
 * Auth state interface for state management
 */
export interface AuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Platform-specific state
  accessToken?: string;  // Mobile
  sessionId?: string;    // Web
}

/**
 * Login form data (UI layer)
 */
export interface LoginFormData {
  loginMethod: 'email' | 'phone';
  email: string;
  phoneNumber: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Register form data (UI layer)
 */
export interface RegisterFormData {
  phoneNumber?: string;
  email?: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  name?: string; // Unified name field
}

/**
 * Auth context interface for React context
 */
export interface AuthContextType {
  authState: AuthState;
  login: (request: LoginRequest) => Promise<UnifiedAuthResponse>;
  logout: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<UnifiedAuthResponse>;
  refreshToken?: () => Promise<UnifiedAuthResponse>;
  isLoading: boolean;
}

// Additional auth types not covered by DTOs
export interface AuthTokenPayload {
  sub: string;
  email?: string;
  phone?: string;
  role: Role;
  iat: number;
  exp: number;
}

// Re-export for convenience and backward compatibility
export type AuthUser = UnifiedUser;
export type AuthResponse = UnifiedAuthResponse;
export type LoginResponse = UnifiedAuthResponse;
export type LoginMethod = 'email' | 'phone';

// Legacy type aliases (temporary backward compatibility)
// These are now in dto/auth files to avoid conflicts

// Auth constants
export const AUTH_ERRORS = {
  // Common errors
  INVALID_CREDENTIALS: 'Invalid email/phone or password',
  ACCOUNT_INACTIVE: 'Account is inactive',
  ACCOUNT_BLOCKED: 'Account is blocked. Try again in 15 minutes',
  SESSION_EXPIRED: 'Session expired. Please login again',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  
  // Registration errors
  PASSWORD_TOO_WEAK: 'Password is too weak',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_INVITATION_CODE: 'Invalid invitation code',
  INVITATION_CODE_EXPIRED: 'Invitation code expired',
  INVITATION_CODE_USED: 'Invitation code already used',
  
  // NextAuth errors
  CredentialsSignin: 'Invalid email or password',
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset link sent to email',
  ACCOUNT_CREATED: 'Account created successfully',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
} as const;