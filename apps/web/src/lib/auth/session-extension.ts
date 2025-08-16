import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { prisma } from '@repo/database';
import { TokenService } from '@repo/auth';

/**
 * Session extension for web compatibility
 * Extends NextAuth sessions with additional security features
 */

const tokenService = new TokenService();

/**
 * Extended session with additional security information
 */
export interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    emailVerified?: boolean;
  };
  expires: string;
  security: {
    activeSessions: number;
    lastLoginAt?: Date;
    loginCount: number;
    canAccessMobile: boolean;
  };
}

/**
 * Get extended session with security information
 */
export async function getExtendedSession(req: any, res: any): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    // Get additional user information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        loginCount: true,
        refreshTokens: {
          where: {
            isRevoked: false,
            expiresAt: { gt: new Date() }
          },
          select: { id: true }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: !!user.emailVerified,
      },
      expires: session.expires,
      security: {
        activeSessions: user.refreshTokens.length,
        lastLoginAt: user.lastLoginAt || undefined,
        loginCount: user.loginCount,
        canAccessMobile: true, // Web sessions can access mobile features
      }
    };
  } catch (error) {
    console.error('❌ Failed to get extended session:', error);
    return null;
  }
}

/**
 * Generate API access token for web sessions
 * Allows web users to access mobile-style API endpoints
 */
export async function generateApiTokenForSession(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      }
    });

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    // Generate a short-lived access token for API access
    const accessToken = await tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      deviceId: 'web-session', // Special device ID for web sessions
    });

    return accessToken;
  } catch (error) {
    console.error('❌ Failed to generate API token for session:', error);
    return null;
  }
}

/**
 * Validate web session and optionally generate API token
 */
export async function validateWebSession(req: any, res: any): Promise<{
  session: ExtendedSession | null;
  apiToken?: string;
}> {
  const session = await getExtendedSession(req, res);
  
  if (!session) {
    return { session: null };
  }

  // Generate API token for authenticated web users
  const apiToken = await generateApiTokenForSession(session.user.id);

  return {
    session,
    apiToken: apiToken || undefined,
  };
}

/**
 * Revoke all mobile sessions for a web user
 */
export async function revokeAllMobileSessions(userId: string): Promise<boolean> {
  try {
    await tokenService.revokeAllUserTokens(userId);
    console.log(`✅ Revoked all mobile sessions for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to revoke mobile sessions:', error);
    return false;
  }
}

/**
 * Get active mobile sessions for web user
 */
export async function getMobileSessionsForUser(userId: string): Promise<any[]> {
  try {
    return await tokenService.getActiveSessions(userId);
  } catch (error) {
    console.error('❌ Failed to get mobile sessions:', error);
    return [];
  }
}

/**
 * Impersonation support for admin users
 */
export async function createImpersonationToken(
  adminUserId: string,
  targetUserId: string
): Promise<string | null> {
  try {
    // Verify admin has permission to impersonate
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true, isActive: true }
    });

    if (!admin || !admin.isActive || admin.role !== 'ADMIN') {
      throw new Error('Insufficient permissions for impersonation');
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      }
    });

    if (!targetUser || !targetUser.isActive || targetUser.deletedAt) {
      throw new Error('Target user not found or inactive');
    }

    // Generate impersonation token with special claims
    const impersonationToken = await tokenService.generateAccessToken({
      userId: targetUser.id,
      role: targetUser.role,
      email: targetUser.email,
      deviceId: `impersonation-${adminUserId}`,
    });

    // Log impersonation for audit
    await prisma.userActivityLog.create({
      data: {
        userId: targetUserId,
        action: 'impersonation_started',
        details: JSON.stringify({
          adminUserId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    console.log(`🎭 Impersonation token created: Admin ${adminUserId} → User ${targetUserId}`);
    return impersonationToken;

  } catch (error) {
    console.error('❌ Failed to create impersonation token:', error);
    return null;
  }
}

/**
 * End impersonation session
 */
export async function endImpersonation(
  adminUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Revoke impersonation tokens
    await prisma.refreshToken.updateMany({
      where: {
        userId: targetUserId,
        deviceId: { startsWith: `impersonation-${adminUserId}` },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Log end of impersonation
    await prisma.userActivityLog.create({
      data: {
        userId: targetUserId,
        action: 'impersonation_ended',
        details: JSON.stringify({
          adminUserId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    console.log(`🎭 Impersonation ended: Admin ${adminUserId} → User ${targetUserId}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to end impersonation:', error);
    return false;
  }
}