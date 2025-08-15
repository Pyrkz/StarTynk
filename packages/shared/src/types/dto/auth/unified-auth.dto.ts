import { z } from 'zod';
import { LoginMethod, ClientType } from '../../enums';

// Unified login request schema
export const unifiedLoginRequestSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  loginMethod: z.enum(['email', 'phone']).optional(),
  clientType: z.enum(['web', 'mobile']).optional(),
  deviceId: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

export type UnifiedLoginRequest = z.infer<typeof unifiedLoginRequestSchema>;

// Unified registration request schema
export const unifiedRegisterRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone number is required',
    path: ['email'],
  }
);

export type UnifiedRegisterRequest = z.infer<typeof unifiedRegisterRequestSchema>;

// User DTO for unified auth responses
export interface UnifiedUserDTO {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Unified auth response
export interface UnifiedAuthResponse {
  success: boolean;
  user: UnifiedUserDTO;
  loginMethod: LoginMethod;
  // For mobile:
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  // For web:
  sessionId?: string;
  redirectUrl?: string;
}

// Refresh token request
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().optional(),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

// Refresh token response
export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Session response
export interface SessionResponse {
  success: boolean;
  user: UnifiedUserDTO | null;
  isAuthenticated: boolean;
}

// Logout response
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Verify token request
export const verifyTokenRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  type: z.enum(['access', 'refresh']).optional().default('access'),
});

export type VerifyTokenRequest = z.infer<typeof verifyTokenRequestSchema>;

// Verify token response
export interface VerifyTokenResponse {
  success: boolean;
  valid: boolean;
  expired: boolean;
  user?: UnifiedUserDTO;
}

// OTP request schemas
export const sendOtpRequestSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required'),
  type: z.enum(['phone', 'email']),
  purpose: z.enum(['login', 'register', 'reset_password', 'verify']),
});

export type SendOtpRequest = z.infer<typeof sendOtpRequestSchema>;

export const verifyOtpRequestSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'register', 'reset_password', 'verify']),
});

export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;

// Error response
export interface AuthErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}