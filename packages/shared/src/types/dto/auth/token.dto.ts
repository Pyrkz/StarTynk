/**
 * Authentication token types
 */

/**
 * JWT token payload
 */
export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
  jti?: string; // JWT ID
}

/**
 * Auth tokens structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number; // Seconds
}

/**
 * Decoded token with user info
 */
export interface DecodedToken extends TokenPayload {
  isExpired: boolean;
}

/**
 * Session info for web app
 */
export interface SessionInfo {
  sessionId: string;
  userId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  lastAccessedAt: Date | string;
}