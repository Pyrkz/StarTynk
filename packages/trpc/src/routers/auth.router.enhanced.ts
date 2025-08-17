import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../server';
import { authMiddleware } from '../middleware';
import {
  unifiedLoginRequestSchema,
  unifiedRegisterRequestSchema,
  refreshTokenRequestSchema,
  sendOtpRequestSchema,
  verifyOtpRequestSchema,
  verifyTokenRequestSchema,
  type UnifiedAuthResponse,
  type RefreshTokenResponse,
  type SessionResponse,
  type LogoutResponse,
  type VerifyTokenResponse,
  ClientType,
  LoginMethod,
} from '@repo/shared';
import { isAuthenticatedContext } from '../context';
import { TokenService } from '@repo/auth';
import { PasswordUtils } from '@repo/auth';

// Initialize enhanced token service
const tokenService = new TokenService();

/**
 * Enhanced authentication router with production-grade security
 */
export const enhancedAuthRouter = router({
  /**
   * Mobile login endpoint with comprehensive security
   */
  mobileLogin: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(1, 'Identifier is required'),
        password: z.string().min(1, 'Password is required'),
        loginMethod: z.enum(['email', 'phone']).optional(),
        deviceId: z.string().min(1, 'Device ID is required'),
        deviceName: z.string().optional(),
        deviceInfo: z.object({
          platform: z.enum(['ios', 'android']),
          version: z.string(),
          model: z.string(),
          appVersion: z.string().optional(),
        }).optional(),
        rememberMe: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }): Promise<UnifiedAuthResponse> => {
      const { identifier, password, loginMethod, deviceId, deviceName, deviceInfo, rememberMe } = input;

      // Extract request metadata
      const ip = ctx.ip || 'unknown';
      const userAgent = ctx.userAgent || 'unknown';

      try {
        // Check rate limiting
        const rateLimitCheck = await tokenService.checkRateLimit(identifier, ip);
        if (!rateLimitCheck.allowed) {
          await tokenService.logAuthEvent({
            identifier,
            ip,
            userAgent,
            success: false,
            reason: 'rate_limit_exceeded',
            deviceId,
          });

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Too many login attempts. Try again in ${Math.ceil((rateLimitCheck.resetTime.getTime() - Date.now()) / 60000)} minutes.`,
          });
        }

        // Determine login method if not provided
        const detectedMethod: LoginMethod = loginMethod 
          ? (loginMethod === 'email' ? LoginMethod.EMAIL : LoginMethod.PHONE)
          : (identifier.includes('@') ? LoginMethod.EMAIL : LoginMethod.PHONE);

        // Find user by email or phone
        const whereClause = detectedMethod === LoginMethod.EMAIL 
          ? { email: identifier }
          : { phone: identifier };

        const user = await ctx.prisma.user.findFirst({
          where: {
            ...whereClause,
            isActive: true,
            deletedAt: null,
          },
        });

        if (!user) {
          await tokenService.logAuthEvent({
            identifier,
            ip,
            userAgent,
            success: false,
            reason: 'user_not_found',
            deviceId,
          });

          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Verify password
        const isPasswordValid = await PasswordUtils.verify(password, user.password || '');

        if (!isPasswordValid) {
          await tokenService.logAuthEvent({
            identifier,
            ip,
            userAgent,
            success: false,
            reason: 'invalid_password',
            deviceId,
          });

          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Validate device consistency for security
        const deviceConsistent = await tokenService.validateDeviceConsistency(
          deviceId,
          userAgent,
          ip
        );

        if (!deviceConsistent) {
          await tokenService.logAuthEvent({
            identifier,
            ip,
            userAgent,
            success: false,
            reason: 'device_inconsistency',
            deviceId,
          });

          console.warn(`⚠️  Device inconsistency detected for user ${user.id} on device ${deviceId}`);
        }

        // Generate token pair
        const accessToken = await tokenService.generateAccessToken({
          userId: user.id,
          role: user.role,
          email: user.email,
          deviceId,
        });

        const refreshToken = await tokenService.generateRefreshToken({
          userId: user.id,
          deviceId,
          deviceName: deviceName || `${deviceInfo?.platform} ${deviceInfo?.model}` || 'Unknown Device',
          userAgent,
          ip,
          loginMethod: detectedMethod,
        });

        // Enforce device limit
        const config = { maxDevicesPerUser: 5 }; // From auth config
        await tokenService.enforceDeviceLimit(user.id, config.maxDevicesPerUser);

        // Update login statistics
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
        });

        // Log successful login
        await tokenService.logAuthEvent({
          identifier,
          ip,
          userAgent,
          success: true,
          deviceId,
        });

        const userDto = {
          id: user.id,
          email: user.email,
          phone: user.phone || undefined,
          name: user.name || undefined,
          role: user.role,
          emailVerified: !!user.emailVerified,
          phoneVerified: false, // TODO: Implement phone verification
        };

        return {
          success: true,
          user: userDto,
          loginMethod: detectedMethod,
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 minutes
        };
      } catch (error) {
        console.error('Mobile login error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Log unknown errors
        await tokenService.logAuthEvent({
          identifier,
          ip,
          userAgent,
          success: false,
          reason: 'server_error',
          deviceId,
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed due to server error',
        });
      }
    }),

  /**
   * Enhanced token refresh with rotation and security validation
   */
  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
        deviceId: z.string().min(1, 'Device ID is required'),
      })
    )
    .mutation(async ({ input, ctx }): Promise<RefreshTokenResponse> => {
      const { refreshToken, deviceId } = input;
      const ip = ctx.ip || 'unknown';
      const userAgent = ctx.userAgent || 'unknown';

      try {
        // Validate device consistency
        const deviceConsistent = await tokenService.validateDeviceConsistency(
          deviceId,
          userAgent,
          ip
        );

        if (!deviceConsistent) {
          console.warn(`⚠️  Device inconsistency detected during token refresh for device ${deviceId}`);
        }

        // Rotate refresh token (includes comprehensive security checks)
        const tokens = await tokenService.rotateRefreshToken(refreshToken, deviceId);

        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        };
      } catch (error) {
        console.error('Token refresh error:', error);
        
        // Clear tokens on refresh failure for security
        if (error instanceof Error && error.message.includes('reuse detected')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Security violation detected. Please log in again.',
          });
        }
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token refresh failed',
        });
      }
    }),

  /**
   * Mobile logout with comprehensive token revocation
   */
  mobileLogout: protectedProcedure
    .use(authMiddleware)
    .input(
      z.object({
        refreshToken: z.string().optional(),
        deviceId: z.string().optional(),
        logoutFromAllDevices: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }): Promise<LogoutResponse> => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const { refreshToken, deviceId, logoutFromAllDevices } = input;

      try {
        if (logoutFromAllDevices) {
          // Revoke all refresh tokens for user
          await tokenService.revokeAllUserTokens(ctx.userId);
        } else if (refreshToken) {
          // Try to get JTI from refresh token for precise revocation
          try {
            const { payload } = await tokenService.verifyRefreshToken(refreshToken);
            await tokenService.revokeRefreshToken(payload.jti!);
          } catch {
            // If token verification fails, try deviceId revocation
            if (deviceId) {
              await tokenService.revokeTokenFamily(ctx.userId, deviceId);
            }
          }
        } else if (deviceId) {
          // Revoke all tokens for this device
          await tokenService.revokeTokenFamily(ctx.userId, deviceId);
        } else {
          // Fallback: revoke all user tokens
          await tokenService.revokeAllUserTokens(ctx.userId);
        }

        return {
          success: true,
          message: 'Successfully logged out',
        };
      } catch (error) {
        console.error('Logout error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Logout failed',
        });
      }
    }),

  /**
   * Get active sessions for security management
   */
  getActiveSessions: protectedProcedure
    .use(authMiddleware)
    .query(async ({ ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      try {
        const sessions = await tokenService.getActiveSessions(ctx.userId);
        
        return {
          success: true,
          sessions: sessions.map(session => ({
            id: session.id,
            deviceId: session.deviceId,
            deviceName: session.deviceName,
            ip: session.ip,
            loginMethod: session.loginMethod,
            issuedAt: session.issuedAt,
            expiresAt: session.expiresAt,
          })),
        };
      } catch (error) {
        console.error('Get active sessions error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve active sessions',
        });
      }
    }),

  /**
   * Revoke specific session
   */
  revokeSession: protectedProcedure
    .use(authMiddleware)
    .input(
      z.object({
        sessionId: z.string().min(1, 'Session ID is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const { sessionId } = input;

      try {
        // Find the session and verify ownership
        const session = await ctx.prisma.refreshToken.findUnique({
          where: { id: sessionId },
          select: { userId: true, jti: true },
        });

        if (!session || session.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }

        // Revoke the specific session
        await tokenService.revokeRefreshToken(session.jti);

        return {
          success: true,
          message: 'Session revoked successfully',
        };
      } catch (error) {
        console.error('Revoke session error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke session',
        });
      }
    }),

  /**
   * Get authentication security status
   */
  getSecurityStatus: protectedProcedure
    .use(authMiddleware)
    .query(async ({ ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      try {
        const sessions = await tokenService.getActiveSessions(ctx.userId);
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.userId },
          select: {
            lastLoginAt: true,
            loginCount: true,
            emailVerified: true,
          },
        });

        return {
          success: true,
          activeSessions: sessions.length,
          lastLoginAt: user?.lastLoginAt,
          totalLogins: user?.loginCount || 0,
          emailVerified: !!user?.emailVerified,
          phoneVerified: false, // TODO: Implement phone verification
        };
      } catch (error) {
        console.error('Get security status error:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve security status',
        });
      }
    }),

  /**
   * Verify token validity (utility endpoint)
   */
  verifyToken: publicProcedure
    .input(verifyTokenRequestSchema)
    .query(async ({ input, ctx }): Promise<VerifyTokenResponse> => {
      const { token, type } = input;

      try {
        if (type === 'access') {
          const payload = await tokenService.verifyAccessToken(token);
          
          const user = await ctx.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              role: true,
              emailVerified: true,
              isActive: true,
              deletedAt: true,
            },
          });

          if (!user || !user.isActive || user.deletedAt) {
            return {
              success: true,
              valid: false,
              expired: false,
            };
          }

          return {
            success: true,
            valid: true,
            expired: false,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone || undefined,
              name: user.name || undefined,
              role: user.role,
              emailVerified: !!user.emailVerified,
              phoneVerified: false,
            },
          };
        } else {
          // Refresh token verification
          const { payload } = await tokenService.verifyRefreshToken(token);
          
          return {
            success: true,
            valid: true,
            expired: false,
          };
        }
      } catch (error) {
        console.error('Token verification error:', error);
        
        return {
          success: true,
          valid: false,
          expired: true,
        };
      }
    }),
});