import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@repo/database';
import type { User, Role } from '@repo/database';
import type { TokenPayload, SecurityContext } from '../types';
import { getAuthConfig } from '../config';
import { extractIpAddress } from '../utils';

/**
 * Create JWT access and refresh tokens for mobile auth
 */
export async function createTokens(
  user: User,
  securityContext: SecurityContext
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const config = getAuthConfig();
  
  // Create access token payload
  const accessPayload: TokenPayload = {
    sub: user.id,
    userId: user.id,
    email: user.email || '',
    role: user.role,
    type: 'access',
    loginMethod: 'email',
  };
  
  // Create access token
  const accessToken = jwt.sign(
    accessPayload,
    config.jwtSecret,
    { expiresIn: config.tokenExpiry } as jwt.SignOptions
  );
  
  // Create refresh token payload  
  const refreshPayload: TokenPayload = {
    sub: user.id,
    userId: user.id,
    email: user.email || '',
    role: user.role,
    deviceId: securityContext.deviceId,
    type: 'refresh',
    loginMethod: 'email',
  };
  
  // Generate JTI for refresh token
  const jti = crypto.randomUUID();
  
  // Add JTI to refresh token payload
  refreshPayload.jti = jti;
  
  // Create refresh token
  const refreshToken = jwt.sign(
    refreshPayload,
    config.jwtRefreshSecret,
    { expiresIn: config.refreshExpiry } as jwt.SignOptions
  );
  
  // Calculate expiry time in milliseconds
  const expiryMs = parseTokenExpiry(config.refreshExpiry);
  const expiresAt = new Date(Date.now() + expiryMs);
  
  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      deviceId: securityContext.deviceId || '',
      userAgent: securityContext.userAgent || '',
      ip: securityContext.ip || '',
      loginMethod: securityContext.loginMethod || 'email',
      jti: jti,
    },
  });
  
  // Return access token expiry in seconds
  const accessExpiryMs = parseTokenExpiry(config.tokenExpiry);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(accessExpiryMs / 1000),
  };
}

/**
 * Verify JWT access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const config = getAuthConfig();
  
  try {
    const payload = jwt.verify(token, config.jwtSecret as string) as TokenPayload;
    
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify JWT refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const config = getAuthConfig();
  
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret as string) as TokenPayload;
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Verify refresh token exists in database
 */
export async function verifyRefreshTokenInDb(token: string): Promise<{
  user: User;
  refreshToken: any;
}> {
  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!refreshTokenRecord) {
    throw new Error('Refresh token not found');
  }
  
  if (refreshTokenRecord.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id }
    });
    throw new Error('Refresh token expired');
  }
  
  return {
    user: refreshTokenRecord.user,
    refreshToken: refreshTokenRecord,
  };
}

/**
 * Invalidate refresh token
 */
export async function invalidateRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token }
  });
}

/**
 * Invalidate all refresh tokens for a user
 */
export async function invalidateAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
}

/**
 * Invalidate all refresh tokens for a user except current device
 */
export async function invalidateOtherUserTokens(
  userId: string, 
  deviceId?: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { 
      userId,
      deviceId: deviceId ? { not: deviceId } : undefined
    }
  });
}

/**
 * Get user from access token
 */
export async function getUserFromAccessToken(token: string): Promise<User | null> {
  try {
    const payload = await verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

/**
 * Parse token expiry string to milliseconds
 */
function parseTokenExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Invalid expiry format: ${expiry}`);
  }
}

/**
 * Create security context from request headers
 */
export function createSecurityContext(
  headers: Record<string, string | undefined>,
  deviceId?: string,
  loginMethod?: 'email' | 'phone'
): SecurityContext {
  return {
    userAgent: headers['user-agent'],
    ip: extractIpAddress(headers),
    deviceId,
    loginMethod,
    timestamp: new Date(),
  };
}