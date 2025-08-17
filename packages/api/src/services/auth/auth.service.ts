import { prisma } from '@repo/database';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  emailValidator,
  phoneValidator,
} from '@repo/validation';
import type { 
  AuthResponse, 
  AuthTokenPayload, 
  AuthTokensDTO as AuthTokens, 
  TokenPayloadDTO as JwtPayload, 
  TokenPayloadDTO as RefreshTokenPayload 
} from '@repo/shared/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors';
// TODO: Replace with @repo/shared after consolidation
// import {
//   AuthTokens,
//   AuthResponse,
//   JwtPayload,
//   RefreshTokenPayload,
// } from './auth.types';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async login(data: unknown): Promise<AuthResponse> {
    const validated = loginSchema.parse(data);

    // Handle different login methods
    let user: any;
    let identifier: string;
    let password: string | null = null;

    switch (validated.method) {
      case 'email':
        identifier = validated.email;
        password = validated.password;
        break;
      case 'phone':
        identifier = validated.phone;
        password = validated.password;
        break;
      case 'biometric':
        // For biometric, we need to verify the biometric token
        // This is a placeholder - implement actual biometric verification
        throw new UnauthorizedError('Biometric login not yet implemented');
      default:
        throw new UnauthorizedError('Invalid login method');
    }

    // Find user by email or phone
    user = await this.findUserByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated');
    }

    // Verify password (skip for biometric)
    if (password && user.password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens(user, validated.deviceId);

    // Store refresh token for mobile clients with deviceId
    if (validated.deviceId && typeof validated.deviceId === 'string' && tokens.refreshToken) {
      await this.storeRefreshToken(
        user.id,
        tokens.refreshToken,
        validated.deviceId
      );
    }

    return this.buildAuthResponse(user, tokens);
  }

  async register(data: unknown): Promise<AuthResponse> {
    const validated = registerSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { phone: validated.phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === validated.email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.phone === validated.phone) {
        throw new ConflictError('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        phone: validated.phone,
        password: hashedPassword,
        name: validated.name,
        role: validated.role,
        isActive: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return this.buildAuthResponse(user, tokens);
  }

  async refreshToken(data: unknown): Promise<AuthTokens> {
    const validated = refreshTokenSchema.parse(data);

    try {
      if (!this.JWT_SECRET || this.JWT_SECRET === 'your-secret-key') {
        throw new Error('JWT_SECRET not properly configured');
      }
      
      // Verify refresh token
      const payload = jwt.verify(
        validated.refreshToken,
        this.JWT_SECRET
      ) as RefreshTokenPayload;

      // Check if token exists in database (for mobile clients)
      if (validated.deviceId) {
        const storedToken = await prisma.refreshToken.findFirst({
          where: {
            token: validated.refreshToken,
            userId: payload.sub,
            deviceId: validated.deviceId,
            expiresAt: { gt: new Date() },
          },
        });

        if (!storedToken) {
          throw new UnauthorizedError('Invalid refresh token');
        }
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const newTokens = this.generateTokens(user, validated.deviceId);

      // Update stored refresh token (for mobile clients)
      if (validated.deviceId && newTokens.refreshToken) {
        await prisma.refreshToken.updateMany({
          where: {
            token: validated.refreshToken,
            userId: user.id,
            deviceId: validated.deviceId,
          },
          data: {
            token: newTokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      }

      return newTokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(userId: string, deviceId?: string): Promise<void> {
    if (deviceId) {
      // Remove specific device refresh token
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          deviceId,
        },
      });
    } else {
      // Remove all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      if (!this.JWT_SECRET || this.JWT_SECRET === 'your-secret-key') {
        throw new Error('JWT_SECRET not properly configured');
      }
      const payload = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }

  private async findUserByIdentifier(identifier: string) {
    const isEmail = emailValidator.safeParse(identifier).success;
    const isPhone = phoneValidator.safeParse(identifier).success;

    if (!isEmail && !isPhone) {
      return null;
    }

    return prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              isEmail ? { email: identifier.toLowerCase() } : {},
              isPhone ? { phone: identifier } : {},
            ],
          },
        ],
      },
    });
  }

  private generateTokens(user: any, deviceId?: string): AuthTokens & { refreshToken: string } {
    if (!this.JWT_SECRET || this.JWT_SECRET === 'your-secret-key') {
      throw new Error('JWT_SECRET not properly configured');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshPayload: RefreshTokenPayload = {
      ...payload,
      deviceId,
    };

    const refreshToken = jwt.sign(refreshPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    deviceId: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // First try to find existing token
    const existingToken = await prisma.refreshToken.findFirst({
      where: {
        userId,
        deviceId,
      },
    });

    if (existingToken) {
      // Update existing token
      await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          expiresAt,
          issuedAt: new Date(),
        },
      });
    } else {
      // Create new token
      await prisma.refreshToken.create({
        data: {
          userId,
          token,
          deviceId,
          expiresAt,
          loginMethod: 'email', // Default login method
          jti: `${userId}-${deviceId}-${Date.now()}`, // Generate JTI
        },
      });
    }
  }

  private buildAuthResponse(user: any, tokens: AuthTokens): AuthResponse {
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified ? true : false,
        phoneVerified: false, // Default value since we don't have phone verification yet
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

export const authService = new AuthService();