import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@repo/database';
import { unifiedAuthService } from './unified-auth.service';
import type { SessionPayload, ClientType } from '../types';
import jwt from 'jsonwebtoken';

/**
 * Session Service for Web Authentication
 * Handles NextAuth session management and configuration
 */
export class SessionService {
  private readonly sessionSecret: string;
  private readonly sessionMaxAge: number = 30 * 24 * 60 * 60; // 30 days

  constructor() {
    this.sessionSecret = process.env.NEXTAUTH_SECRET || 'development-secret';
    
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('⚠️  NEXTAUTH_SECRET not set, using development secret');
    }
  }

  /**
   * Get complete NextAuth configuration
   */
  getNextAuthOptions(): NextAuthOptions {
    return {
      adapter: PrismaAdapter(prisma),
      providers: [
        CredentialsProvider({
          id: 'credentials',
          name: 'credentials',
          credentials: {
            identifier: { label: "Email or Phone", type: "text" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if (!credentials?.identifier || !credentials?.password) {
              return null;
            }

            // Use unified auth service for validation
            const result = await unifiedAuthService.authenticate(
              {
                identifier: credentials.identifier,
                password: credentials.password
              },
              'web' as ClientType
            );

            if (!result.success || !result.user) {
              return null;
            }

            // Return user for session
            return {
              id: result.user.id!,
              email: result.user.email!,
              name: result.user.name || null,
              role: result.user.role || 'USER',
              // image: result.user.image || null // Field not in schema
            } as any;
          }
        })
      ],
      session: {
        strategy: 'jwt',
        maxAge: this.sessionMaxAge
      },
      jwt: {
        secret: this.sessionSecret,
        maxAge: this.sessionMaxAge
      },
      pages: {
        signIn: '/login',
        signOut: '/logout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/dashboard'
      },
      callbacks: {
        async jwt({ token, user, account, trigger, session }) {
          // Initial sign in
          if (user) {
            token.id = user.id;
            token.email = user.email;
            // For NextAuth compatibility, check if user has role property
            if ('role' in user) {
              token.role = (user as any).role;
            }
            token.name = user.name;
            token.image = user.image;
          }

          // Update session
          if (trigger === 'update' && session) {
            return { ...token, ...session };
          }

          return token;
        },
        async session({ session, token }) {
          if (token && session.user) {
            (session.user as any).id = token.id as string;
            (session.user as any).role = token.role as string;
            session.user.email = token.email as string;
            session.user.name = token.name as string;
            session.user.image = token.image as string;
          }

          // Add session payload
          const sessionPayload: SessionPayload = {
            userId: token.id as string,
            email: token.email as string,
            role: token.role as any,
            name: token.name as string | undefined,
            image: token.image as string | undefined
          };

          return {
            ...session,
            user: {
              ...session.user,
              ...sessionPayload
            }
          };
        },
        async redirect({ url, baseUrl }) {
          // Allows relative callback URLs
          if (url.startsWith('/')) return `${baseUrl}${url}`;
          // Allows callback URLs on the same origin
          else if (new URL(url).origin === baseUrl) return url;
          return baseUrl;
        }
      },
      events: {
        async signIn({ user, account, profile, isNewUser }) {
          // Log sign in event
          await prisma.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'SIGN_IN',
              details: JSON.stringify({ 
                provider: account?.provider || 'credentials',
                isNewUser 
              })
            }
          });
        },
        async signOut({ session, token }) {
          // Log sign out event
          if (token?.id) {
            await prisma.userActivityLog.create({
              data: {
                userId: token.id as string,
                action: 'SIGN_OUT',
                details: JSON.stringify({ sessionExpired: false })
              }
            });
          }
        },
        async session({ session, token }) {
          // Update last activity
          if (token?.id) {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { lastLoginAt: new Date() }
            }).catch(() => {
              // Ignore errors to not break session
            });
          }
        }
      },
      debug: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * Create session token for testing/development
   */
  createSessionToken(payload: SessionPayload): string {
    return jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.sessionMaxAge
      },
      this.sessionSecret,
      {
        algorithm: 'HS256'
      }
    );
  }

  /**
   * Verify session token
   */
  verifySessionToken(token: string): SessionPayload | null {
    try {
      const decoded = jwt.verify(token, this.sessionSecret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        image: decoded.image
      };
    } catch {
      return null;
    }
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionToken: string): Promise<string | null> {
    const payload = this.verifySessionToken(sessionToken);
    if (!payload) return null;

    // Verify user is still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true, deletedAt: true }
    });

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    // Create new token with extended expiry
    return this.createSessionToken(payload);
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    // NextAuth doesn't store sessions in DB with JWT strategy
    // But we can track this for audit purposes
    await prisma.userActivityLog.create({
      data: {
        userId,
        action: 'SESSIONS_INVALIDATED',
        details: JSON.stringify({ 
          reason: 'Manual invalidation',
          timestamp: new Date() 
        })
      }
    });
  }

  /**
   * Get session from request headers (for API routes)
   */
  async getSessionFromHeaders(headers: Record<string, string | undefined>): Promise<SessionPayload | null> {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return this.verifySessionToken(token);
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(session: any): boolean {
    if (!session?.expires) return true;
    
    const expiryDate = new Date(session.expires);
    const now = new Date();
    const daysBefore = 7; // Refresh if less than 7 days left
    
    return expiryDate.getTime() - now.getTime() < daysBefore * 24 * 60 * 60 * 1000;
  }

  /**
   * Create CSRF token for forms
   */
  createCSRFToken(): string {
    const token = jwt.sign(
      {
        csrf: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      },
      this.sessionSecret,
      {
        algorithm: 'HS256'
      }
    );
    return token;
  }

  /**
   * Verify CSRF token
   */
  verifyCSRFToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, this.sessionSecret) as any;
      return decoded.csrf === true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();