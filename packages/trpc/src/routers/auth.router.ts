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
  LoginMethod,
  ClientType,
} from '@repo/shared';
import { isAuthenticatedContext } from '../context';
import { TokenService, PasswordUtils } from '@repo/auth';

// Initialize enhanced token service
const tokenService = new TokenService();

/**
 * Authentication router with all auth-related procedures
 */
export const authRouter = router({
  /**
   * Unified login endpoint supporting both email and phone
   */
  login: publicProcedure
    .input(unifiedLoginRequestSchema)
    .mutation(async ({ input, ctx }): Promise<UnifiedAuthResponse> => {
      const { identifier, password, loginMethod, clientType, deviceId, rememberMe } = input;

      try {
        // Determine login method if not provided
        const detectedMethod = loginMethod 
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
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Verify password
        const { PasswordUtils } = await import('@repo/auth');
        const isPasswordValid = await PasswordUtils.verify(password, user.password || '');

        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
          }

        // Update login statistics
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
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

        // Handle mobile client (JWT tokens)
        if (clientType === ClientType.MOBILE) {
          const { TokenService } = await import('@repo/auth');
          const tokenService = new TokenService();

          const accessToken = await tokenService.generateAccessToken({
            userId: user.id,
            role: user.role,
            email: user.email,
          });

          const refreshToken = await tokenService.generateRefreshToken({
            userId: user.id,
            deviceId: deviceId || 'unknown',
          });

          // Store refresh token in database
          await ctx.prisma.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              deviceId: deviceId || '',
              userAgent: ctx.userAgent || null,
              ip: ctx.ip || null,
              loginMethod: detectedMethod,
              jti: `jti_${user.id}_${Date.now()}`, // JWT ID for tracking
            },
          });

          return {
            success: true,
            user: userDto,
            loginMethod: detectedMethod,
            accessToken,
            refreshToken,
            expiresIn: 3600, // 1 hour
          };
        }

        // Handle web client (session-based)
        const session = await ctx.prisma.session.create({
          data: {
            userId: user.id,
            sessionToken: crypto.randomUUID(),
            expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
          },
        });

        return {
          success: true,
          user: userDto,
          loginMethod: detectedMethod,
          sessionId: session.id,
          redirectUrl: '/dashboard',
        };
      } catch (error) {
        console.error('Login error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed due to server error',
        });
      }
    }),

  /**
   * User registration
   */
  register: publicProcedure
    .input(unifiedRegisterRequestSchema)
    .mutation(async ({ input, ctx }): Promise<UnifiedAuthResponse> => {
      const { email, phone, password, name } = input;

      try {
        // Check if user already exists
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [
              email ? { email } : {},
              phone ? { phone } : {},
            ].filter(condition => Object.keys(condition).length > 0),
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email or phone already exists',
          });
        }

        // Hash password
        const { PasswordUtils } = await import('@repo/auth');
        const hashedPassword = await PasswordUtils.hash(password);

        // Create user
        const user = await ctx.prisma.user.create({
          data: {
            email: email || '',
            phone,
            name,
            password: hashedPassword,
            role: 'USER',
            isActive: true,
          },
        });

        const userDto = {
          id: user.id,
          email: user.email,
          phone: user.phone || undefined,
          name: user.name || undefined,
          role: user.role,
          emailVerified: false,
          phoneVerified: false,
        };

        return {
          success: true,
          user: userDto,
          loginMethod: email ? LoginMethod.EMAIL : LoginMethod.PHONE,
          redirectUrl: '/verify-email',
        };
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed due to server error',
        });
      }
    }),

  /**
   * Refresh JWT tokens
   */
  refreshToken: publicProcedure
    .input(refreshTokenRequestSchema)
    .mutation(async ({ input, ctx }): Promise<RefreshTokenResponse> => {
      const { refreshToken, deviceId } = input;

      try {
        // Find and validate refresh token
        const storedToken = await ctx.prisma.refreshToken.findUnique({
          where: { 
            token: refreshToken,
            expiresAt: { gt: new Date() }
          },
          include: { user: true },
        });

        if (!storedToken || !storedToken.user.isActive || storedToken.user.deletedAt) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired refresh token',
          });
        }

        // Generate new tokens
        const { TokenService } = await import('@repo/auth');
        const tokenService = new TokenService();

        const accessToken = await tokenService.generateAccessToken({
          userId: storedToken.user.id,
          role: storedToken.user.role,
          email: storedToken.user.email,
        });

        const newRefreshToken = await tokenService.generateRefreshToken({
          userId: storedToken.user.id,
          deviceId: deviceId || storedToken.deviceId || 'unknown',
        });

        // Update refresh token in database
        await ctx.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: {
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        return {
          success: true,
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600, // 1 hour
        };
      } catch (error) {
        console.error('Token refresh error:', error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Token refresh failed',
        });
      }
    }),

  /**
   * Get current user session
   */
  me: protectedProcedure
    .use(authMiddleware)
    .query(async ({ ctx }): Promise<SessionResponse> => {
      if (!isAuthenticatedContext(ctx)) {
        return {
          success: false,
          user: null,
          isAuthenticated: false,
        };
      }

      return {
        success: true,
        user: ctx.user,
        isAuthenticated: true,
      };
    }),

  /**
   * Logout user
   */
  logout: protectedProcedure
    .use(authMiddleware)
    .mutation(async ({ ctx }): Promise<LogoutResponse> => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      try {
        // For web sessions
        if (ctx.sessionId) {
          await ctx.prisma.session.delete({
            where: { id: ctx.sessionId },
          });
        }

        // For mobile - invalidate all refresh tokens for user
        await ctx.prisma.refreshToken.deleteMany({
          where: { userId: ctx.userId },
        });

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
   * Verify token validity
   */
  verifyToken: publicProcedure
    .input(verifyTokenRequestSchema)
    .query(async ({ input, ctx }): Promise<VerifyTokenResponse> => {
      const { token, type } = input;

      try {
        const { TokenService } = await import('@repo/auth');
        const tokenService = new TokenService();

        const result = type === 'access' 
          ? await tokenService.verifyAccessToken(token)
          : await tokenService.verifyRefreshToken(token);

        // Handle both access token (direct TokenPayload) and refresh token (object with payload property)
        const actualPayload = 'payload' in result ? result.payload : result;
        if (!result || (!(actualPayload as any).userId && !(actualPayload as any).sub)) {
          return {
            success: true,
            valid: false,
            expired: true,
          };
        }

        // Get user data
        const userId = (actualPayload as any).userId || (actualPayload as any).sub;
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
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
      } catch (error) {
        console.error('Token verification error:', error);
        
        return {
          success: true,
          valid: false,
          expired: true,
        };
      }
    }),

  /**
   * Send OTP for phone/email verification
   */
  sendOtp: publicProcedure
    .input(sendOtpRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement OTP sending logic when SMS/Email services are ready
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'OTP functionality not yet implemented',
      });
    }),

  /**
   * Verify OTP
   */
  verifyOtp: publicProcedure
    .input(verifyOtpRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement OTP verification logic
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'OTP functionality not yet implemented',
      });
    }),

  /**
   * Enhanced mobile login with comprehensive security
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
      const { identifier, password, loginMethod, deviceId, deviceName, deviceInfo } = input;
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
            message: `Too many login attempts. Try again later.`,
          });
        }

        // Determine login method
        const detectedMethod: LoginMethod = loginMethod 
          ? (loginMethod === 'email' ? LoginMethod.EMAIL : LoginMethod.PHONE)
          : (identifier.includes('@') ? LoginMethod.EMAIL : LoginMethod.PHONE);

        // Find user
        const whereClause = detectedMethod === LoginMethod.EMAIL 
          ? { email: identifier }
          : { phone: identifier };

        const user = await ctx.prisma.user.findFirst({
          where: { ...whereClause, isActive: true, deletedAt: null },
        });

        if (!user) {
          await tokenService.logAuthEvent({
            identifier, ip, userAgent, success: false, reason: 'user_not_found', deviceId,
          });
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await PasswordUtils.verify(password, user.password || '');
        if (!isPasswordValid) {
          await tokenService.logAuthEvent({
            identifier, ip, userAgent, success: false, reason: 'invalid_password', deviceId,
          });
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = await tokenService.generateAccessToken({
          userId: user.id, role: user.role, email: user.email, deviceId,
        });

        const refreshToken = await tokenService.generateRefreshToken({
          userId: user.id, deviceId,
          deviceName: deviceName || `${deviceInfo?.platform} ${deviceInfo?.model}` || 'Unknown Device',
          userAgent, ip, loginMethod: detectedMethod,
        });

        // Update login stats
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
        });

        // Log success
        await tokenService.logAuthEvent({
          identifier, ip, userAgent, success: true, deviceId,
        });

        return {
          success: true,
          user: {
            id: user.id, email: user.email, phone: user.phone || undefined,
            name: user.name || undefined, role: user.role,
            emailVerified: !!user.emailVerified, phoneVerified: false,
          },
          loginMethod: detectedMethod, accessToken, refreshToken, expiresIn: 900,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Login failed' });
      }
    }),

  /**
   * Enhanced token refresh
   */
  mobileRefresh: publicProcedure
    .input(z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
      deviceId: z.string().min(1, 'Device ID is required'),
    }))
    .mutation(async ({ input }): Promise<RefreshTokenResponse> => {
      try {
        const tokens = await tokenService.rotateRefreshToken(input.refreshToken, input.deviceId);
        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('reuse detected')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Security violation detected. Please log in again.',
          });
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token refresh failed' });
      }
    }),

  /**
   * Get active sessions
   */
  getActiveSessions: protectedProcedure
    .use(authMiddleware)
    .query(async ({ ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      const sessions = await tokenService.getActiveSessions(ctx.userId);
      return {
        success: true,
        sessions: sessions.map(s => ({
          id: s.id, deviceId: s.deviceId, deviceName: s.deviceName,
          ip: s.ip, loginMethod: s.loginMethod, issuedAt: s.issuedAt, expiresAt: s.expiresAt,
        })),
      };
    }),

  /**
   * Revoke specific session
   */
  revokeSession: protectedProcedure
    .use(authMiddleware)
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAuthenticatedContext(ctx)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      const session = await ctx.prisma.refreshToken.findUnique({
        where: { id: input.sessionId },
        select: { userId: true, jti: true },
      });

      if (!session || session.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      await tokenService.revokeRefreshToken(session.jti);
      return { success: true, message: 'Session revoked successfully' };
    }),
});