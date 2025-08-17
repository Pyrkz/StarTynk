import type { User, Role } from '@repo/database';
import type { JWTPayload } from 'jose';

// Client types
export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile'
}

// Login DTOs
export interface LoginDto {
  identifier: string; // email or phone
  password: string;
  clientType?: ClientType;
  deviceId?: string; // Required for mobile
  deviceName?: string; // Optional device name for mobile
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  invitationCode: string;
  clientType?: ClientType;
}

// Token interfaces
export interface TokenPayload extends JWTPayload {
  sub: string; // userId
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
  sessionId?: string;
  deviceId?: string;
  loginMethod: 'email' | 'phone';
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string; // JWT ID for tracking
  tokenFamily?: string; // For rotation tracking
}

// Session interfaces
export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  name?: string;
  image?: string;
}

// Auth responses
export interface WebAuthResponse {
  success: boolean;
  user: Partial<User>;
  session: SessionPayload;
  message?: string;
}

export interface MobileAuthResponse {
  success: boolean;
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  message?: string;
}

export type AuthResponse = WebAuthResponse | MobileAuthResponse;

// User DTO for responses
export interface UserResponseDTO {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Unified auth response
export interface UnifiedAuthResponse {
  success: boolean;
  user?: UserResponseDTO;
  authData?: WebAuthResponse | MobileAuthResponse;
  clientType?: ClientType;
  loginMethod?: LoginMethod;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  redirectUrl?: string;
  error?: string;
  message?: string;
}

// Refresh responses
export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  session?: SessionPayload;
  message?: string;
}

// Auth context
export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
  clientType: ClientType;
  deviceId?: string;
  sessionId?: string;
}

// Error types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_TOKEN_REUSED = 'REFRESH_TOKEN_REUSED',
  DEVICE_MISMATCH = 'DEVICE_MISMATCH',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Security interfaces
export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface LoginAttemptInfo {
  identifier: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
  deviceId?: string;
}

// Login method type
export type LoginMethod = 'email' | 'phone';

// Security context
export interface SecurityContext {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  platform?: string;
  timestamp?: Date;
  loginMethod?: 'email' | 'phone';
}

// Password validation options
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

// Additional token types
export interface RefreshTokenResponse {
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

// Client detection options
export interface ClientDetectionOptions {
  userAgent?: string;
  authHeader?: string;
  clientTypeHeader?: string;
  accept?: string;
  contentType?: string;
  origin?: string;
  customHeaders?: Record<string, string>;
}

// Auth provider interface
export interface AuthProvider {
  login(credentials: LoginDto): Promise<AuthResult>;
  logout(): Promise<void>;
  refresh(refreshToken: string): Promise<RefreshTokenResponse>;
  validateToken(token: string): Promise<boolean>;
}

// Auth result interface
export interface AuthResult {
  success: boolean;
  user?: Partial<User>;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  session?: SessionPayload;
  error?: AuthError;
  message?: string;
}