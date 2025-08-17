import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { tokenService } from './jwt.service';
import { createSecurityContext } from './token.service';
import { 
  ClientType
} from '../types';
import type { 
  LoginDto, 
  AuthResponse,
  WebAuthResponse,
  MobileAuthResponse,
  UnifiedAuthResponse,
  RefreshResponse,
  AuthErrorCode,
  DeviceInfo,
  RegisterDto,
  UserResponseDTO
} from '../types';
import { validatePassword } from '../utils/password.utils';
import { extractIpAddress } from '../utils/security.utils';

/**
 * Unified Authentication Service
 * Handles both session-based (web) and JWT-based (mobile) authentication
 */
export class UnifiedAuthService {
  /**
   * Authenticate user with email/phone and password
   * Returns appropriate response based on client type
   */
  async authenticate(
    credentials: LoginDto, 
    clientType: ClientType,
    headers?: Record<string, string | undefined>
  ): Promise<UnifiedAuthResponse> {
    try {
      // Validate credentials
      const user = await this.validateCredentials(credentials);
      
      if (!user) {
        return {
          success: false,
          user: this.createEmptyUserResponseDTO(),
          authData: { success: false, message: 'Invalid credentials' } as AuthResponse,
          clientType
        };
      }

      // Check if user is active
      if (!user.isActive || user.deletedAt) {
        return {
          success: false,
          user: this.createEmptyUserResponseDTO(),
          authData: { success: false, message: 'Account is inactive' } as AuthResponse,
          clientType
        };
      }

      // Update login stats
      await this.updateLoginStats(user.id);

      // Generate appropriate auth response
      const authData = await this.generateAuthResponse(user, clientType, credentials, headers);

      return {
        success: true,
        user: this.userToResponseDTO(user),
        authData,
        clientType
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        user: this.createEmptyUserResponseDTO(),
        authData: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Authentication failed' 
        } as AuthResponse,
        clientType
      };
    }
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(credentials: LoginDto): Promise<User | null> {
    const { identifier, password } = credentials;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user || !user.password) {
      // Log failed attempt
      await this.logLoginAttempt({
        identifier,
        success: false,
        reason: 'USER_NOT_FOUND'
      });
      return null;
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Log failed attempt
      await this.logLoginAttempt({
        identifier,
        success: false,
        reason: 'INVALID_PASSWORD'
      });
      return null;
    }

    // Log successful attempt
    await this.logLoginAttempt({
      identifier,
      success: true
    });

    return user;
  }

  /**
   * Generate auth response based on client type
   */
  async generateAuthResponse(
    user: User, 
    clientType: ClientType,
    credentials: LoginDto,
    headers?: Record<string, string | undefined>
  ): Promise<AuthResponse> {
    if (clientType === ClientType.WEB) {
      return this.generateWebResponse(user);
    } else {
      return this.generateMobileResponse(user, credentials, headers);
    }
  }

  /**
   * Generate web auth response (session-based)
   */
  private generateWebResponse(user: User): WebAuthResponse {
    return {
      success: true,
      user: this.sanitizeUser(user),
      session: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name || undefined,
        image: user.image || undefined
      }
    };
  }

  /**
   * Generate mobile auth response (JWT-based)
   */
  private async generateMobileResponse(
    user: User,
    credentials: LoginDto,
    headers?: Record<string, string | undefined>
  ): Promise<MobileAuthResponse> {
    // Validate device info for mobile
    if (!credentials.deviceId) {
      throw new Error('Device ID is required for mobile authentication');
    }

    // Check device consistency
    const isValidDevice = await tokenService.validateDeviceConsistency(
      credentials.deviceId,
      headers?.['user-agent'],
      extractIpAddress(headers || {})
    );

    if (!isValidDevice) {
      throw new Error('Device validation failed');
    }

    // Generate JWT tokens
    const accessToken = await tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      deviceId: credentials.deviceId
    });

    const refreshToken = await tokenService.generateRefreshToken({
      userId: user.id,
      deviceId: credentials.deviceId,
      deviceName: credentials.deviceName,
      userAgent: headers?.['user-agent'],
      ip: extractIpAddress(headers || {}),
      loginMethod: user.email === credentials.identifier ? 'email' : 'phone'
    });

    // Enforce device limit
    await tokenService.enforceDeviceLimit(user.id);

    return {
      success: true,
      user: this.userToResponseDTO(user),
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer'
    };
  }

  /**
   * Refresh authentication (mobile: new tokens, web: extend session)
   */
  async refreshAuth(
    token: string,
    clientType: ClientType,
    deviceId?: string
  ): Promise<RefreshResponse> {
    try {
      if (clientType === ClientType.WEB) {
        // Web sessions are handled by NextAuth
        return {
          success: true,
          message: 'Session extended'
        };
      }

      // Mobile token refresh
      if (!deviceId) {
        throw new Error('Device ID is required for token refresh');
      }

      const result = await tokenService.rotateRefreshToken(token, deviceId);

      return {
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      };
    } catch (error) {
      console.error('Refresh auth error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Refresh failed'
      };
    }
  }

  /**
   * Logout user (revoke tokens/sessions)
   */
  async logout(
    userId: string,
    clientType: ClientType,
    deviceId?: string
  ): Promise<void> {
    if (clientType === ClientType.MOBILE) {
      if (deviceId) {
        // Revoke tokens for specific device
        await tokenService.revokeTokenFamily(userId, deviceId);
      } else {
        // Revoke all tokens
        await tokenService.revokeAllUserTokens(userId);
      }
    }
    // Web sessions are handled by NextAuth
  }

  /**
   * Register new user
   */
  async register(data: RegisterDto, clientType: ClientType): Promise<UnifiedAuthResponse> {
    try {
      // Validate invitation code
      const invitation = await prisma.invitationCode.findUnique({
        where: { code: data.invitationCode }
      });

      if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
        return {
          success: false,
          user: this.createEmptyUserResponseDTO(),
          authData: { success: false, message: 'Invalid or expired invitation code' } as AuthResponse,
          clientType
        };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return {
          success: false,
          user: this.createEmptyUserResponseDTO(),
          authData: { success: false, message: 'User already exists' } as AuthResponse,
          clientType
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: invitation.role,
          invitedBy: invitation.invitedBy
        }
      });

      // Mark invitation as used
      await prisma.invitationCode.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });

      // Log user activity
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          details: JSON.stringify({ invitationCode: data.invitationCode })
        }
      });

      // Auto-login after registration
      return this.authenticate(
        { identifier: data.email, password: data.password },
        clientType
      );
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        user: this.createEmptyUserResponseDTO(),
        authData: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Registration failed' 
        } as AuthResponse,
        clientType
      };
    }
  }

  /**
   * Get NextAuth configuration for web
   */
  getNextAuthConfig(): Partial<NextAuthOptions> {
    const authService = this; // Capture reference to this instance
    return {
      providers: [
        CredentialsProvider({
          name: 'credentials',
          credentials: {
            identifier: { label: "Email or Phone", type: "text" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if (!credentials?.identifier || !credentials?.password) {
              return null;
            }

            const user = await authService.validateCredentials({
              identifier: credentials.identifier,
              password: credentials.password
            });

            if (!user) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image
            } as any;
          }
        })
      ],
      callbacks: {
        async jwt({ token, user }) {
          if (user) {
            token.id = user.id;
            token.role = (user as User).role;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user) {
            (session.user as any).id = token.id as string;
            (session.user as any).role = token.role as string;
          }
          return session;
        }
      }
    };
  }

  /**
   * Update user login statistics
   */
  private async updateLoginStats(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 }
      }
    });
  }

  /**
   * Log login attempt for security monitoring
   */
  private async logLoginAttempt(data: {
    identifier: string;
    success: boolean;
    reason?: string;
    ip?: string;
    userAgent?: string;
    deviceId?: string;
  }): Promise<void> {
    await prisma.loginAttempt.create({
      data: {
        identifier: data.identifier,
        success: data.success,
        reason: data.reason,
        ip: data.ip || '',
        userAgent: data.userAgent,
        deviceId: data.deviceId
      }
    });
  }

  /**
   * Sanitize user object for response
   */
  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Convert User to UserResponseDTO
   */
  private userToResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || undefined,
      name: user.name || undefined,
      role: user.role,
      emailVerified: user.emailVerified !== null,
      phoneVerified: false // TODO: Add phoneVerified field to User model when phone verification is implemented
    };
  }

  /**
   * Create empty UserResponseDTO for error cases
   */
  private createEmptyUserResponseDTO(): UserResponseDTO {
    return {
      id: '',
      email: '',
      role: 'WORKER', // Default role
      emailVerified: false,
      phoneVerified: false
    };
  }

  /**
   * Get current access token from token service
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // This is a placeholder - in real implementation, this would
      // get the token from current session or stored token
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get current user ID from session or token
   */
  getCurrentUserId(): string | undefined {
    try {
      // This is a placeholder - in real implementation, this would
      // get user ID from current session or stored token
      return undefined;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return undefined;
    }
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService();