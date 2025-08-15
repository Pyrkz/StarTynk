import type { User } from '@repo/database';

/**
 * Client type detection
 */
export type ClientType = 'web' | 'mobile';

/**
 * Login method detection
 */
export type LoginMethod = 'email' | 'phone';

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  user: User | null;
  clientType?: ClientType;
  error?: string;
}

/**
 * Unified authentication response
 */
export interface UnifiedAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  loginMethod?: LoginMethod;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  redirectUrl?: string;
  error?: string;
}

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  type?: 'access' | 'refresh';
  deviceId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId?: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Session response
 */
export interface SessionResponse {
  success: boolean;
  user: User | null;
  isAuthenticated: boolean;
  error?: string;
}

/**
 * Client detection options
 */
export interface ClientDetectionOptions {
  userAgent?: string;
  authHeader?: string;
  clientTypeHeader?: string;
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
  authenticate(request: any): Promise<AuthResult>;
  createSession?(user: User): Promise<void>;
  clearSession?(request: any): Promise<void>;
}

/**
 * Password validation options
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Security context
 */
export interface SecurityContext {
  userAgent?: string;
  ip?: string;
  deviceId?: string;
  loginMethod?: LoginMethod;
  timestamp: Date;
}