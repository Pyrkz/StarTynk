import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { User } from '@repo/database';
import type { AuthResult, AuthProvider } from '../types';
import { getAuthConfig } from '../config';
import { getUserById, logUserActivity, createSecurityContext } from '../services';

/**
 * Session Authentication Provider for web clients
 */
export class SessionAuthProvider implements AuthProvider {
  /**
   * Authenticate request using NextAuth session or session cookie
   */
  async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Try NextAuth session first
      const nextAuthSession = await this.getNextAuthSession();
      
      if (nextAuthSession?.user?.id) {
        const user = await getUserById(nextAuthSession.user.id);
        
        if (user) {
          return {
            authenticated: true,
            user,
            clientType: 'web'
          };
        }
      }
      
      // Fallback to custom session cookie
      const sessionUser = await this.getSessionFromCookie();
      
      if (sessionUser) {
        return {
          authenticated: true,
          user: sessionUser,
          clientType: 'web'
        };
      }
      
      return {
        authenticated: false,
        user: null,
        error: 'No valid session found'
      };
    } catch (error) {
      return {
        authenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Session authentication failed'
      };
    }
  }
  
  /**
   * Create a web session for the user
   */
  async createSession(user: User): Promise<void> {
    const config = getAuthConfig();
    
    // Create session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.sessionSecret,
      { expiresIn: '24h' }
    );
    
    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: config.sessionCookieName,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    // Log session creation
    const securityContext = createSecurityContext({});
    await logUserActivity(
      user.id,
      'session_created',
      { sessionType: 'web' },
      securityContext
    );
  }
  
  /**
   * Clear web session
   */
  async clearSession(request: NextRequest): Promise<void> {
    const config = getAuthConfig();
    
    // Clear session cookie
    const cookieStore = cookies();
    cookieStore.delete(config.sessionCookieName);
    
    // Note: NextAuth sessions are cleared by NextAuth itself
  }
  
  /**
   * Get NextAuth session
   */
  private async getNextAuthSession(): Promise<any> {
    try {
      return await getServerSession();
    } catch {
      return null;
    }
  }
  
  /**
   * Get user from custom session cookie
   */
  private async getSessionFromCookie(): Promise<User | null> {
    try {
      const config = getAuthConfig();
      const cookieStore = cookies();
      const sessionToken = cookieStore.get(config.sessionCookieName)?.value;
      
      if (!sessionToken) {
        return null;
      }
      
      // Verify session token
      const payload = jwt.verify(sessionToken, config.sessionSecret) as any;
      
      if (!payload.userId) {
        return null;
      }
      
      // Get user from database
      const user = await getUserById(payload.userId);
      
      return user;
    } catch {
      return null;
    }
  }
}