import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import type { SecurityContext, RefreshTokenResponse } from '../types';
import { 
  verifyRefreshToken, 
  verifyRefreshTokenInDb, 
  createTokens, 
  invalidateRefreshToken 
} from './token.service';
import { addDays } from 'date-fns';

/**
 * Rotate refresh token (one-time use)
 */
export async function rotateRefreshToken(
  oldToken: string,
  securityContext: SecurityContext
): Promise<RefreshTokenResponse> {
  try {
    // Verify the JWT format first
    const payload = await verifyRefreshToken(oldToken);
    
    // Verify token exists in database and get user
    const { user, refreshToken: oldRefreshToken } = await verifyRefreshTokenInDb(oldToken);
    
    // Delete the old refresh token (one-time use)
    await invalidateRefreshToken(oldToken);
    
    // Create new tokens
    const tokens = await createTokens(user, securityContext);
    
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Refresh access token using refresh token (wrapper for API compatibility)
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}> {
  const securityContext = {
    ip: '127.0.0.1', // Will be set by middleware in real usage
    userAgent: 'API',
    deviceId: 'api-refresh',
  };

  const result = await rotateRefreshToken(refreshToken, securityContext);
  
  if (!result.success || !result.accessToken || !result.refreshToken) {
    throw new Error(result.error || 'Token refresh failed');
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
  };
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  
  return result.count;
}

/**
 * Clean up old refresh tokens for a device (keep only the latest N)
 */
export async function cleanupOldDeviceTokens(
  userId: string, 
  deviceId: string, 
  keepCount: number = 1
): Promise<number> {
  // Get all tokens for this user/device ordered by creation date
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      deviceId,
    },
    orderBy: {
      issuedAt: 'desc'
    }
  });
  
  // Keep only the latest N tokens
  if (tokens.length > keepCount) {
    const tokensToDelete = tokens.slice(keepCount);
    const tokenIds = tokensToDelete.map(t => t.id);
    
    const result = await prisma.refreshToken.deleteMany({
      where: {
        id: {
          in: tokenIds
        }
      }
    });
    
    return result.count;
  }
  
  return 0;
}

/**
 * Get refresh token statistics for a user
 */
export async function getRefreshTokenStats(userId: string): Promise<{
  total: number;
  expired: number;
  active: number;
  devices: number;
}> {
  const now = new Date();
  
  const [total, expired, devices] = await Promise.all([
    prisma.refreshToken.count({
      where: { userId }
    }),
    prisma.refreshToken.count({
      where: { 
        userId,
        expiresAt: { lt: now }
      }
    }),
    prisma.refreshToken.groupBy({
      by: ['deviceId'],
      where: { userId },
      _count: true
    })
  ]);
  
  return {
    total,
    expired,
    active: total - expired,
    devices: devices.length,
  };
}

/**
 * Revoke all refresh tokens for a user (force logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { userId }
  });
  
  return result.count;
}

/**
 * Revoke all refresh tokens for a specific device
 */
export async function revokeDeviceTokens(
  userId: string, 
  deviceId: string
): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { 
      userId,
      deviceId 
    }
  });
  
  return result.count;
}

/**
 * Get active devices for a user
 */
export async function getUserActiveDevices(userId: string): Promise<Array<{
  deviceId: string;
  userAgent?: string;
  ip?: string;
  lastUsed: Date;
  loginMethod?: string;
}>> {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    },
    select: {
      deviceId: true,
      userAgent: true,
      ip: true,
      issuedAt: true,
      loginMethod: true,
    },
    orderBy: {
      issuedAt: 'desc'
    }
  });
  
  // Group by device ID and get the latest for each device
  const deviceMap = new Map();
  
  tokens.forEach(token => {
    if (token.deviceId && !deviceMap.has(token.deviceId)) {
      deviceMap.set(token.deviceId, {
        deviceId: token.deviceId,
        userAgent: token.userAgent,
        ip: token.ip,
        lastUsed: token.issuedAt,
        loginMethod: token.loginMethod,
      });
    }
  });
  
  return Array.from(deviceMap.values());
}

/**
 * Setup automatic cleanup job for expired tokens
 */
export function setupTokenCleanupJob(): void {
  // Run cleanup every hour
  const interval = setInterval(async () => {
    try {
      const cleaned = await cleanupExpiredTokens();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired refresh tokens`);
      }
    } catch (error) {
      console.error('Token cleanup job failed:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // Cleanup on process exit
  process.on('SIGINT', () => {
    clearInterval(interval);
  });
  
  process.on('SIGTERM', () => {
    clearInterval(interval);
  });
}