import jwt from 'jsonwebtoken';
import { Role } from '@shared/types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Get secrets from environment variables with validation
const getJWTSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not configured');
  }
  
  return { accessSecret, refreshSecret };
};

/**
 * Signs an access token with a short expiration time
 * @param payload User information to include in the token
 * @returns Signed JWT access token
 */
export const signAccessToken = (payload: JWTPayload): string => {
  const { accessSecret } = getJWTSecrets();
  
  return jwt.sign(payload, accessSecret, {
    expiresIn: '15m',
    issuer: process.env.JWT_ISSUER || 'startynk-api',
  });
};

/**
 * Signs a refresh token with a longer expiration time
 * @param userId The user ID to include in the token
 * @returns Signed JWT refresh token
 */
export const signRefreshToken = (userId: string): string => {
  const { refreshSecret } = getJWTSecrets();
  
  return jwt.sign({ userId }, refreshSecret, {
    expiresIn: '7d',
    issuer: process.env.JWT_ISSUER || 'startynk-api',
  });
};

/**
 * Verifies and decodes an access token
 * @param token The JWT access token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  const { accessSecret } = getJWTSecrets();
  
  try {
    const decoded = jwt.verify(token, accessSecret, {
      issuer: process.env.JWT_ISSUER || 'startynk-api',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verifies and decodes a refresh token
 * @param token The JWT refresh token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const { refreshSecret } = getJWTSecrets();
  
  try {
    const decoded = jwt.verify(token, refreshSecret, {
      issuer: process.env.JWT_ISSUER || 'startynk-api',
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Generates both access and refresh tokens for a user
 * @param userId The user ID
 * @param email The user's email
 * @param role The user's role
 * @returns Object containing both tokens
 */
export const generateTokenPair = (userId: string, email: string, role: Role) => {
  const accessToken = signAccessToken({ userId, email, role });
  const refreshToken = signRefreshToken(userId);
  
  return { accessToken, refreshToken };
};