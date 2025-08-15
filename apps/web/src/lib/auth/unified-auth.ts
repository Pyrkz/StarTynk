import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { User } from '@repo/database';
import { detectLoginMethod, normalizeEmail, normalizePhone } from './validators';
import type { ClientType, LoginMethod, UnifiedAuthResponse } from '@repo/shared/types';

/**
 * Detects the client type from request headers
 */
export function detectClientType(request: NextRequest): ClientType {
  // Check explicit header
  const clientTypeHeader = request.headers.get('X-Client-Type');
  if (clientTypeHeader === 'mobile' || clientTypeHeader === 'web') {
    return clientTypeHeader;
  }
  
  // Check for Bearer token
  if (request.headers.get('Authorization')?.startsWith('Bearer ')) {
    return 'mobile';
  }
  
  // Check User-Agent for mobile app
  const userAgent = request.headers.get('User-Agent') || '';
  const mobileAppIdentifier = process.env.MOBILE_APP_IDENTIFIER || 'com.startynk.mobile';
  if (userAgent.includes(mobileAppIdentifier) || userAgent.includes('Expo')) {
    return 'mobile';
  }
  
  // Default to web
  return 'web';
}

/**
 * Finds user by email or phone
 */
export async function findUserByIdentifier(
  identifier: string,
  loginMethod: LoginMethod
): Promise<User | null> {
  const normalizedIdentifier = loginMethod === 'email' 
    ? normalizeEmail(identifier)
    : normalizePhone(identifier);
  
  return await prisma.user.findFirst({
    where: loginMethod === 'email'
      ? { email: normalizedIdentifier }
      : { phone: normalizedIdentifier }
  });
}

/**
 * Validates user credentials
 */
export async function validateCredentials(
  identifier: string,
  password: string
): Promise<{ user: User | null; loginMethod: LoginMethod }> {
  const loginMethod = detectLoginMethod(identifier);
  if (loginMethod === 'invalid') {
    return { user: null, loginMethod: 'email' };
  }
  
  const user = await findUserByIdentifier(identifier, loginMethod);
  if (!user || !user.password) {
    return { user: null, loginMethod };
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { user: null, loginMethod };
  }
  
  return { user, loginMethod };
}

/**
 * Creates JWT tokens for mobile auth
 */
export async function createTokens(
  user: User,
  deviceId?: string,
  loginMethod?: LoginMethod,
  request?: NextRequest
) {
  const jwtSecret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
  
  // Create access token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '15m' }
  );
  
  // Create refresh token
  const refreshTokenPayload = {
    userId: user.id,
    deviceId,
    type: 'refresh',
  };
  
  const refreshToken = jwt.sign(
    refreshTokenPayload,
    refreshSecret,
    { expiresIn: '30d' }
  );
  
  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      deviceId,
      userAgent: request?.headers.get('User-Agent') || undefined,
      ip: request?.headers.get('X-Forwarded-For') || request?.headers.get('X-Real-IP') || undefined,
      loginMethod,
    },
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Creates a session for web auth
 */
export async function createWebSession(user: User): Promise<void> {
  // For now, we'll use a simple session approach
  // In production, integrate with NextAuth or similar
  const sessionToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '24h' }
  );
  
  const cookieStore = cookies();
  cookieStore.set({
    name: process.env.SESSION_COOKIE_NAME || '__session',
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Generates appropriate auth response based on client type
 */
export async function generateAuthResponse(
  user: User,
  clientType: ClientType,
  loginMethod: LoginMethod,
  deviceId?: string,
  request?: NextRequest
): Promise<UnifiedAuthResponse> {
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
    },
  });
  
  // Remove sensitive data
  const userDTO = {
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: user.name || undefined,
    role: user.role,
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
  };
  
  if (clientType === 'mobile') {
    const tokens = await createTokens(user, deviceId, loginMethod, request);
    return {
      success: true,
      user: userDTO,
      loginMethod,
      ...tokens,
    };
  } else {
    await createWebSession(user);
    return {
      success: true,
      user: userDTO,
      loginMethod,
      redirectUrl: '/dashboard',
    };
  }
}

/**
 * Clears session based on client type
 */
export async function clearSession(request: NextRequest, clientType: ClientType): Promise<void> {
  if (clientType === 'mobile') {
    // For mobile, invalidate the refresh token
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.userId) {
          // Delete all refresh tokens for this user
          await prisma.refreshToken.deleteMany({
            where: { userId: decoded.userId },
          });
        }
      } catch (error) {
        // Ignore decode errors
      }
    }
  } else {
    // For web, clear the session cookie
    const cookieStore = cookies();
    cookieStore.delete(process.env.SESSION_COOKIE_NAME || '__session');
  }
}

/**
 * Extract bearer token from request
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, secret?: string): any {
  return jwt.verify(token, secret || process.env.JWT_SECRET!);
}