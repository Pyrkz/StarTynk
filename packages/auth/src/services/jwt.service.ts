import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@repo/database';
import type { Role } from '@repo/database';
import type { TokenPayload, SecurityContext } from '../types';
import { getAuthConfig } from '../config';

/**
 * Production-grade JWT service with RS256 asymmetric encryption
 * Implements token rotation, device binding, and comprehensive security
 */
export class TokenService {
  private privateKey: string = '';
  private publicKey: string = '';
  private config: any;

  constructor() {
    this.config = getAuthConfig();
    this.initializeKeys();
  }

  /**
   * Initialize RSA key pair for JWT signing
   */
  private initializeKeys() {
    // In production, these should be loaded from secure environment variables
    this.privateKey = process.env.JWT_PRIVATE_KEY || this.generateRSAKeyPair().privateKey;
    this.publicKey = process.env.JWT_PUBLIC_KEY || this.generateRSAKeyPair().publicKey;
    
    if (!process.env.JWT_PRIVATE_KEY) {
      console.warn('⚠️  JWT_PRIVATE_KEY not set, using generated key (not suitable for production)');
    }
  }

  /**
   * Generate RSA key pair for development (not recommended for production)
   */
  private generateRSAKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { privateKey, publicKey };
  }

  /**
   * Generate secure access token with RS256
   */
  async generateAccessToken(payload: {
    userId: string;
    role: Role;
    email: string;
    deviceId?: string;
    loginMethod?: 'email' | 'phone';
  }): Promise<string> {
    const jti = crypto.randomUUID(); // JWT ID for tracking
    
    const tokenPayload: TokenPayload = {
      sub: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: 'access',
      deviceId: payload.deviceId,
      loginMethod: payload.loginMethod || 'email',
      jti,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.config.tokenExpiry,
      issuer: 'startynk-api',
      audience: 'startynk-mobile',
      subject: payload.userId,
      jwtid: jti,
    });
  }

  /**
   * Generate secure refresh token with token family tracking
   */
  async generateRefreshToken(payload: {
    userId: string;
    deviceId: string;
    deviceName?: string;
    userAgent?: string;
    ip?: string;
    loginMethod?: string;
  }): Promise<string> {
    const jti = crypto.randomUUID();
    
    const tokenPayload = {
      userId: payload.userId,
      deviceId: payload.deviceId,
      type: 'refresh',
      jti,
      iat: Math.floor(Date.now() / 1000),
    };

    const refreshToken = jwt.sign(tokenPayload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.config.refreshExpiry,
      issuer: 'startynk-api',
      audience: 'startynk-mobile',
      subject: payload.userId,
      jwtid: jti,
    });

    // Store refresh token in database with enhanced security tracking
    const expiryMs = this.parseTokenExpiry(this.config.refreshExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        deviceId: payload.deviceId,
        deviceName: payload.deviceName || null,
        userAgent: payload.userAgent || null,
        ip: payload.ip || null,
        loginMethod: payload.loginMethod || 'email',
        jti,
        expiresAt,
        issuedAt: new Date(),
        isRevoked: false,
      },
    });

    return refreshToken;
  }

  /**
   * Verify access token with comprehensive validation
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'startynk-api',
        audience: 'startynk-mobile',
      }) as TokenPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Verify user is still active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { isActive: true, deletedAt: true },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new Error('User account is inactive');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token with database validation
   */
  async verifyRefreshToken(token: string): Promise<{
    payload: TokenPayload;
    dbRecord: any;
  }> {
    try {
      // First verify JWT signature and claims
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'startynk-api',
        audience: 'startynk-mobile',
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify token exists in database and is not revoked
      const dbRecord = await prisma.refreshToken.findUnique({
        where: { 
          jti: payload.jti,
          isRevoked: false,
          expiresAt: { gt: new Date() }
        },
        include: { user: true },
      });

      if (!dbRecord) {
        throw new Error('Refresh token not found or revoked');
      }

      if (!dbRecord.user.isActive || dbRecord.user.deletedAt) {
        throw new Error('User account is inactive');
      }

      return { payload, dbRecord };
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
   * Rotate refresh token with family tracking for security
   */
  async rotateRefreshToken(oldToken: string, deviceId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const { payload, dbRecord } = await this.verifyRefreshToken(oldToken);

    // Check for potential token reuse attack
    if (dbRecord.isRevoked || dbRecord.replacedBy) {
      // Revoke entire token family - suspicious activity detected
      await this.revokeTokenFamily(dbRecord.userId, dbRecord.deviceId);
      throw new Error('Token reuse detected - all sessions revoked');
    }

    // Generate new token pair
    const accessToken = await this.generateAccessToken({
      userId: dbRecord.userId,
      role: dbRecord.user.role,
      email: dbRecord.user.email,
      deviceId,
    });

    const newRefreshToken = await this.generateRefreshToken({
      userId: dbRecord.userId,
      deviceId,
      deviceName: dbRecord.deviceName,
      userAgent: dbRecord.userAgent,
      ip: dbRecord.ip,
      loginMethod: dbRecord.loginMethod,
    });

    // Mark old token as replaced
    await prisma.refreshToken.update({
      where: { id: dbRecord.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        replacedBy: (jwt.decode(newRefreshToken) as any)?.jti as string,
      },
    });

    const accessExpiryMs = this.parseTokenExpiry(this.config.tokenExpiry);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: Math.floor(accessExpiryMs / 1000),
    };
  }

  /**
   * Revoke specific refresh token
   */
  async revokeRefreshToken(jti: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { jti, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoke token family (security measure for token reuse detection)
   */
  async revokeTokenFamily(userId: string, deviceId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { 
        userId, 
        deviceId,
        isRevoked: false 
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        ip: true,
        issuedAt: true,
        expiresAt: true,
        loginMethod: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /**
   * Clean up expired tokens (scheduled job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            isRevoked: true,
            revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
          }
        ]
      },
    });

    return result.count;
  }

  /**
   * Enforce device limit per user
   */
  async enforceDeviceLimit(userId: string, maxDevices: number = 5): Promise<void> {
    const activeSessions = await this.getActiveSessions(userId);
    
    if (activeSessions.length > maxDevices) {
      // Revoke oldest sessions
      const oldestSessions = activeSessions
        .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())
        .slice(0, activeSessions.length - maxDevices);

      for (const session of oldestSessions) {
        await prisma.refreshToken.update({
          where: { id: session.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Log authentication event for security monitoring
   */
  async logAuthEvent(event: {
    userId?: string;
    identifier: string;
    ip: string;
    userAgent?: string;
    success: boolean;
    reason?: string;
    deviceId?: string;
  }): Promise<void> {
    await prisma.loginAttempt.create({
      data: {
        identifier: event.identifier,
        ip: event.ip,
        userAgent: event.userAgent,
        success: event.success,
        reason: event.reason,
        deviceId: event.deviceId,
      },
    });
  }

  /**
   * Check rate limiting for authentication attempts
   */
  async checkRateLimit(identifier: string, ip: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime: Date;
  }> {
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    const windowStart = new Date(Date.now() - timeWindow);

    // Count failed attempts in time window
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        OR: [
          { identifier, success: false },
          { ip, success: false },
        ],
        createdAt: { gte: windowStart },
      },
    });

    const allowed = recentAttempts < maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - recentAttempts);
    const resetTime = new Date(Date.now() + timeWindow);

    return { allowed, remainingAttempts, resetTime };
  }

  /**
   * Parse token expiry string to milliseconds
   */
  private parseTokenExpiry(expiry: string): number {
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
   * Create device fingerprint for additional security
   */
  createDeviceFingerprint(userAgent?: string, ip?: string): string {
    const data = `${userAgent || ''}:${ip || ''}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Validate device consistency (prevents device spoofing)
   */
  async validateDeviceConsistency(
    deviceId: string, 
    userAgent?: string, 
    ip?: string
  ): Promise<boolean> {
    const recentToken = await prisma.refreshToken.findFirst({
      where: {
        deviceId,
        isRevoked: false,
        issuedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours
      },
      orderBy: { issuedAt: 'desc' },
    });

    if (!recentToken) return true; // No recent activity to compare

    // Simple consistency check - in production, use more sophisticated fingerprinting
    const userAgentMatch = !recentToken.userAgent || !userAgent || 
                          recentToken.userAgent === userAgent;
    
    return userAgentMatch;
  }
}

// Export singleton instance
export const tokenService = new TokenService();