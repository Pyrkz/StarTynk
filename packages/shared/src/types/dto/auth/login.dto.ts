import { z } from 'zod';
import { User } from '../../models/user.types';

/**
 * Login request DTO
 */
export interface LoginDTO {
  email?: string;
  phone?: string;
  password: string;
  loginMethod: 'email' | 'phone';
  rememberMe?: boolean;
}

/**
 * Login validation schema
 */
export const LoginDTOSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{8,14}$/, 'Invalid phone number')
    .optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  loginMethod: z.enum(['email', 'phone']),
  rememberMe: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.loginMethod === 'email') {
      return !!data.email;
    }
    return !!data.phone;
  },
  {
    message: 'Email or phone is required based on login method',
  }
);

/**
 * User response DTO (without sensitive data)
 */
export interface UserResponseDTO {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
}

/**
 * Login response DTO
 */
export interface LoginResponseDTO {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken?: string; // Only for mobile
  expiresIn?: number; // Token expiry in seconds
  sessionId?: string; // Only for web
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * Refresh token validation schema
 */
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});