import { Role } from '@repo/database';
import type { 
  UnifiedUserDTO,
  UnifiedAuthResponse,
  UnifiedLoginRequest,
  UnifiedRegisterRequest
} from './dto/auth/unified-auth.dto';
import type { TokenPayloadDTO } from './dto/auth/token.dto';

// UnifiedAuthResponse is now imported from DTOs

// Use UnifiedLoginRequest from DTOs
export type LoginRequest = UnifiedLoginRequest;

// Use UnifiedRegisterRequest from DTOs
export type RegisterRequest = UnifiedRegisterRequest;

// RefreshTokenRequest is now defined in dto/auth/unified-auth.dto.ts
// with Zod validation schema and is imported via dto exports

/**
 * Auth state interface for state management
 */
export interface AuthState {
  user: UnifiedUserDTO | null;
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


// Re-export for convenience and backward compatibility
export type AuthUser = UnifiedUserDTO;
export type AuthResponse = UnifiedAuthResponse;
export type LoginResponse = UnifiedAuthResponse;
export type AuthTokenPayload = TokenPayloadDTO;

// Re-export commonly used types from DTOs
export type { 
  RefreshTokenResponse,
  SessionResponse,
  LogoutResponse,
  VerifyTokenResponse,
  UnifiedUserDTO,
  UnifiedLoginRequest,
  UnifiedLoginRequestOptional,
  UnifiedRegisterRequest,
  UnifiedAuthResponse
} from './dto/auth/unified-auth.dto';

export type {
  LoginRequestDTO,
  LoginRequestDTOWithDefaults
} from './dto/auth/login.dto';

export type {
  TokenPayloadDTO,
  AuthTokensDTO
} from './dto/auth/token.dto';

// LoginMethod is exported from enums/auth.enums.ts via dto/index.ts

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