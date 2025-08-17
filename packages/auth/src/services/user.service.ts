import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import type { LoginMethod, UnifiedAuthResponse, SecurityContext, UserResponseDTO } from '../types';
import { ClientType } from '../types';
import { 
  detectLoginMethod, 
  normalizeEmail, 
  normalizePhone, 
  comparePassword
} from '../utils';
import { createTokens } from './token.service';

/**
 * Find user by email or phone
 */
export async function findUserByIdentifier(
  identifier: string,
  loginMethod?: LoginMethod
): Promise<User | null> {
  const detectedMethod = loginMethod || detectLoginMethod(identifier);
  
  if (detectedMethod === 'invalid') {
    return null;
  }
  
  const normalizedIdentifier = detectedMethod === 'email' 
    ? normalizeEmail(identifier)
    : normalizePhone(identifier);
  
  return await prisma.user.findFirst({
    where: {
      ...(detectedMethod === 'email' 
        ? { email: normalizedIdentifier }
        : { phone: normalizedIdentifier }
      ),
      isActive: true,
      deletedAt: null,
    }
  });
}

/**
 * Validate user credentials
 */
export async function validateCredentials(
  identifier: string,
  password: string
): Promise<{ user: User | null; loginMethod: LoginMethod | 'invalid' }> {
  const loginMethod = detectLoginMethod(identifier);
  
  if (loginMethod === 'invalid') {
    return { user: null, loginMethod: 'invalid' };
  }
  
  const user = await findUserByIdentifier(identifier, loginMethod);
  
  if (!user || !user.password) {
    return { user: null, loginMethod };
  }
  
  const isValidPassword = await comparePassword(password, user.password);
  
  if (!isValidPassword) {
    return { user: null, loginMethod };
  }
  
  return { user, loginMethod };
}

/**
 * Update user login statistics
 */
export async function updateUserLoginStats(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
    },
  });
}

/**
 * Generate unified authentication response
 */
export async function generateAuthResponse(
  user: User,
  clientType: ClientType,
  loginMethod: LoginMethod,
  securityContext: SecurityContext
): Promise<UnifiedAuthResponse> {
  // Update login statistics
  await updateUserLoginStats(user.id);
  
  // Sanitize user data for response
  const userDTO: UserResponseDTO = {
    id: user.id,
    email: user.email || '',
    phone: user.phone || undefined,
    name: user.name || undefined,
    role: user.role,
    emailVerified: !!user.emailVerified,
    phoneVerified: false, // phone verification not implemented yet
  };
  
  if (clientType === 'mobile') {
    // Create JWT tokens for mobile
    const tokens = await createTokens(user, securityContext);
    
    return {
      success: true,
      user: userDTO,
      loginMethod,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      clientType: ClientType.MOBILE,
    };
  } else {
    // For web, rely on NextAuth session (no tokens returned)
    return {
      success: true,
      user: userDTO,
      loginMethod,
      redirectUrl: '/dashboard',
      clientType: ClientType.WEB,
    };
  }
}

/**
 * Check if user is locked out due to failed login attempts
 */
export async function checkUserLockout(
  _identifier: string,
  _maxAttempts: number = 5,
  _lockoutDuration: number = 15 * 60 * 1000 // 15 minutes
): Promise<{ isLockedOut: boolean; remainingTime?: number }> {
  // This would typically use Redis or a separate rate limiting service
  // For now, we'll implement a basic in-memory solution
  // In production, consider using a proper rate limiting service
  
  // TODO: Implement proper rate limiting with Redis
  // For now, return not locked out
  return { isLockedOut: false };
}

/**
 * Record failed login attempt
 */
export async function recordFailedLoginAttempt(
  identifier: string,
  ip?: string,
  _userAgent?: string
): Promise<void> {
  // TODO: Implement failed login attempt tracking
  // This could be stored in a separate table or Redis
  
  console.warn(`Failed login attempt for ${identifier} from ${ip}`);
}

/**
 * Get user by ID (for session validation)
 */
export async function getUserById(userId: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
      deletedAt: null,
    }
  });
}

/**
 * Validate user exists and is active
 */
export async function validateUserStatus(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return !!user;
}

/**
 * Create user activity log
 */
export async function logUserActivity(
  userId: string,
  action: string,
  details?: any,
  securityContext?: SecurityContext
): Promise<void> {
  await prisma.userActivityLog.create({
    data: {
      userId,
      action,
      details: details ? JSON.stringify(details) : null,
      ipAddress: securityContext?.ip,
      userAgent: securityContext?.userAgent,
    }
  });
}

/**
 * Get sanitized user data for response
 */
export function getSanitizedUser(user: User | null) {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: user.name || undefined,
    role: user.role,
    emailVerified: !!user.emailVerified,
    phoneVerified: false, // phone verification not implemented yet
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}