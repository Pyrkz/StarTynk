import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { 
  detectClientType, 
  validateCredentials, 
  generateAuthResponse 
} from '@/lib/auth/unified-auth';
import { unifiedLoginRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { logUserActivity } from '@/features/auth/utils/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = unifiedLoginRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { identifier, password, deviceId, rememberMe } = validation.data;
    
    // Detect client type
    const clientType = detectClientType(request);
    
    // Rate limiting check (TODO: Implement proper rate limiting)
    // await checkRateLimit(identifier);
    
    // Validate credentials
    const { user, loginMethod } = await validateCredentials(identifier, password);
    
    if (!user) {
      // Log failed attempt
      await logUserActivity({
        userId: null,
        action: 'LOGIN_FAILED',
        details: JSON.stringify({ 
          identifier, 
          loginMethod,
          clientType,
          reason: 'Invalid credentials' 
        }),
        ipAddress: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || undefined,
        userAgent: request.headers.get('User-Agent') || undefined,
      });
      
      return ApiResponse.unauthorized('Invalid email/phone or password');
    }
    
    // Check if account is active
    if (!user.isActive) {
      return ApiResponse.forbidden('Account is deactivated');
    }
    
    // Check verification status
    if (loginMethod === 'email' && user.email && !user.emailVerified) {
      return ApiResponse.forbidden('Please verify your email first');
    }
    
    if (loginMethod === 'phone' && user.phone && !user.phoneVerified) {
      return ApiResponse.forbidden('Please verify your phone number first');
    }
    
    // Log successful login
    await logUserActivity({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      details: JSON.stringify({ 
        loginMethod,
        clientType,
        deviceId 
      }),
      ipAddress: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
    });
    
    // Generate auth response
    const authResponse = await generateAuthResponse(
      user, 
      clientType, 
      loginMethod, 
      deviceId,
      request
    );
    
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error('Login failed');
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Type',
    },
  });
}