import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { findUserByIdentifier, createTokens, createSecurityContext } from '@repo/auth';
import { ApiResponse } from '@repo/api/responses';
import { comparePassword } from '@repo/auth/utils';
import { Logger } from '@repo/utils/logger';
import { MobileUserDTO } from '@repo/shared/types/dto/mobile';

const logger = new Logger('MobileAuth');

const mobileLoginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceName: z.string().optional(),
  platform: z.enum(['IOS', 'ANDROID']),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = mobileLoginSchema.parse(body);
    
    // Find user by identifier (email or phone)
    const user = await findUserByIdentifier(validated.identifier);
    
    if (!user) {
      logger.warn(`Login attempt with invalid identifier: ${validated.identifier}`);
      return NextResponse.json(
        ApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      logger.warn(`Login attempt with inactive user: ${user.id}`);
      return NextResponse.json(
        ApiResponse.error('Account is disabled', 'ACCOUNT_DISABLED'),
        { status: 401 }
      );
    }
    
    // Verify password
    if (!user.password) {
      logger.warn(`Login attempt for user without password: ${user.id}`);
      return NextResponse.json(
        ApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }
    
    const isPasswordValid = await comparePassword(validated.password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt with invalid password for user: ${user.id}`);
      return NextResponse.json(
        ApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS'),
        { status: 401 }
      );
    }
    
    // Create security context
    const securityContext = createSecurityContext(
      Object.fromEntries(request.headers.entries()),
      validated.deviceId,
      user.email ? 'email' : 'phone'
    );
    
    // Create tokens
    const tokens = await createTokens(user, securityContext);
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });
    
    // Create mobile user DTO
    const mobileUser: MobileUserDTO = {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      role: user.role,
      avatar: user.image || undefined,
    };
    
    logger.info(`Mobile login successful for user: ${user.id}`);
    
    return NextResponse.json(
      ApiResponse.success({
        user: mobileUser,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        syncRequired: true, // Flag to trigger initial sync
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Mobile login validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Mobile login error:', error);
    return NextResponse.json(
      ApiResponse.error('Login failed', 'LOGIN_ERROR'),
      { status: 500 }
    );
  }
}