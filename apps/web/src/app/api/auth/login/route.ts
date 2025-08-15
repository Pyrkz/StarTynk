import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { ApiResponse } from '@/lib/api/response';
import { publicRoute } from '@/lib/api/protected-route';
import { validateRequestBody, sanitizeUser } from '@/lib/api/validators';
import { validateUserCredentials, updateLastLogin } from '@/lib/auth/providers';
import { generateTokenPair } from '@/lib/auth/jwt';
import { LoginDTO } from '@shared/types';
import { createUserActivityLog } from '@/features/auth/utils/activity-logger';
import { rateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit';

// Validation schema for login
const loginSchema = z.object({
  loginMethod: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine(data => {
  if (data.loginMethod === 'email' && !data.email) {
    return false;
  }
  if (data.loginMethod === 'phone' && !data.phone) {
    return false;
  }
  return true;
}, {
  message: 'Email or phone is required based on login method',
});

export const POST = publicRoute(async (request: NextRequest) => {
  // Apply rate limiting for login attempts
  const rateLimitResult = await rateLimit(request, 'login');
  const rateLimitResponse = createRateLimitResponse(rateLimitResult);
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const body = await validateRequestBody(request, loginSchema);
  
  // Validate credentials
  const user = await validateUserCredentials({
    email: body.email,
    phone: body.phone,
    password: body.password,
  });

  if (!user) {
    // Log failed login attempt
    await createUserActivityLog({
      userId: 'anonymous',
      action: 'LOGIN_FAILED',
      details: { 
        loginMethod: body.loginMethod,
        identifier: body.email || body.phone,
        reason: 'Invalid credentials' 
      }
    });

    return ApiResponse.unauthorized('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    await createUserActivityLog({
      userId: user.id,
      action: 'LOGIN_BLOCKED',
      details: { reason: 'Account inactive' }
    });

    return ApiResponse.forbidden('Account is inactive');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    user.id,
    user.email,
    user.role as any
  );

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  // Update last login
  await updateLastLogin(user.id);

  // Log successful login
  await createUserActivityLog({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    details: { 
      method: 'mobile',
      loginMethod: body.loginMethod 
    }
  });

  // Return user data with tokens
  const response = ApiResponse.success({
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  });

  // Add rate limit headers to response
  return addRateLimitHeaders(response, rateLimitResult);
});