import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database';
import { appConfig } from '../../config/app';
import { jwtConfig } from '../../config/jwt';
import type { 
  LoginCredentials, 
  AuthResponse, 
  SafeUser, 
  JWTPayload,
  RefreshTokenPayload 
} from './auth.types';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { identifier, password } = credentials;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw this.fastify.httpErrors.forbidden('Account is deactivated');
    }

    // Verify password
    if (!user.password) {
      throw this.fastify.httpErrors.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw this.fastify.httpErrors.unauthorized('Invalid credentials');
    }

    // Create session
    const sessionToken = this.generateSessionToken();
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user, sessionToken);

    // Return safe user data
    const safeUser = this.getSafeUser(user);

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = await this.fastify.jwt.verify(refreshToken, {
        secret: jwtConfig.refresh.secret,
      }) as RefreshTokenPayload;

      // Check if session exists and is valid
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: payload.sessionId,
          userId: payload.sub,
          expires: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw this.fastify.httpErrors.unauthorized('Invalid or expired session');
      }

      // Check if user is still active
      if (!session.user.isActive) {
        throw this.fastify.httpErrors.forbidden('Account is deactivated');
      }

      // Update session expiry
      await prisma.session.update({
        where: { id: session.id },
        data: {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extend by 7 days
        },
      });

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        session.user, 
        session.sessionToken
      );

      const safeUser = this.getSafeUser(session.user);

      return {
        user: safeUser,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw this.fastify.httpErrors.unauthorized('Invalid refresh token');
    }
  }

  async logout(userId: string, sessionToken?: string): Promise<void> {
    // If sessionToken is provided, delete specific session
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: {
          sessionToken,
          userId,
        },
      });
    } else {
      // Delete all sessions for the user
      await prisma.session.deleteMany({
        where: {
          userId,
        },
      });
    }
  }

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found');
    }

    if (!user.isActive) {
      throw this.fastify.httpErrors.forbidden('Account is deactivated');
    }

    return this.getSafeUser(user);
  }

  private async generateTokens(user: any, sessionToken: string) {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.fastify.jwt.sign(payload, {
      expiresIn: jwtConfig.sign.expiresIn,
    });

    const refreshTokenPayload: RefreshTokenPayload = {
      ...payload,
      sessionId: sessionToken,
    };

    const refreshToken = this.fastify.jwt.sign(refreshTokenPayload, {
      secret: jwtConfig.refresh.secret,
      expiresIn: jwtConfig.refresh.expiresIn,
    });

    return { accessToken, refreshToken };
  }

  private getSafeUser(user: any): SafeUser {
    const { password, deletedAt, ...safeUser } = user;
    return safeUser;
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Clean up expired sessions (can be run as a cron job)
  async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
  }
}