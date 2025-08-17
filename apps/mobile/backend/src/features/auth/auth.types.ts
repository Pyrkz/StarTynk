import { User, Role } from '@prisma/client';

export interface LoginCredentials {
  identifier: string; // Email or phone number
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken?: string; // Only sent in HTTP-only cookie
}

export interface JWTPayload {
  sub: string; // user id (cuid)
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JWTPayload {
  sessionId: string; // sessionToken
}

// User without sensitive data
export type SafeUser = Omit<User, 'password' | 'deletedAt'>;

export interface AuthRequest {
  user?: SafeUser;
  token?: string;
}