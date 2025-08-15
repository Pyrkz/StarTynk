import { Role, ClientType, LoginMethod } from '../../enums';

/**
 * JWT token payload
 */
export interface TokenPayloadDTO {
  sub: string; // User ID
  email?: string | null;
  phone?: string | null;
  role: Role;
  iat?: number; // Issued at
  exp?: number; // Expiration
  jti?: string; // JWT ID
  clientType?: ClientType;
  deviceId?: string;
}

/**
 * Auth tokens structure
 */
export interface AuthTokensDTO {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number; // Seconds
}

/**
 * Token DTO
 */
export interface TokenDTO {
  token: string;
  type: 'access' | 'refresh' | 'verification' | 'reset';
  expiresAt: string;
  issuedAt: string;
}

/**
 * Decoded token with user info
 */
export interface DecodedTokenDTO extends TokenPayloadDTO {
  isExpired: boolean;
  isValid: boolean;
}

/**
 * Session info for web app
 */
export interface SessionDTO {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  createdAt: string;
  lastAccessedAt: string;
  isActive: boolean;
}

/**
 * Session create DTO
 */
export interface CreateSessionDTO {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  duration?: number; // Duration in seconds
}

/**
 * Verify token request DTO
 */
export interface VerifyTokenRequestDTO {
  token: string;
  type?: 'access' | 'refresh' | 'verification' | 'reset';
}

/**
 * Verify token response DTO
 */
export interface VerifyTokenResponseDTO {
  valid: boolean;
  payload?: TokenPayloadDTO;
  error?: string;
}