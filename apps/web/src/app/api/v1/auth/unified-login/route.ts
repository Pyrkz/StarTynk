import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuthService } from '@repo/auth';
import { detectClient, createUnifiedResponse, createErrorResponse } from '@/middleware/client-detection';
import type { LoginRequest, UnifiedAuthResponse } from '@repo/shared/types';

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  loginMethod: z.enum(['email', 'phone']).optional(),
  rememberMe: z.boolean().optional().default(false),
  deviceId: z.string().optional(),
  clientType: z.enum(['web', 'mobile']).optional(),
});

/**
 * Unified login endpoint that handles both web and mobile clients
 * GET /api/v1/auth/unified-login - Not allowed
 * POST /api/v1/auth/unified-login - Login user
 */
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}

export async function POST(request: NextRequest) {
  const clientInfo = detectClient(request);
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    // Auto-detect login method if not provided
    const loginMethod = validatedData.loginMethod || 
      (validatedData.identifier.includes('@') ? 'email' : 'phone');
    
    // Create login request
    const loginRequest: LoginRequest = {
      identifier: validatedData.identifier,
      password: validatedData.password,
      loginMethod,
      rememberMe: validatedData.rememberMe,
      deviceId: validatedData.deviceId,
      clientType: clientInfo.type,
    };
    
    // Perform login using unified auth service
    const authService = createAuthService();
    const result = await authService.login(loginRequest);
    
    if (!result.success) {
      return createErrorResponse(
        result.error || 'Login failed',
        clientInfo,
        401
      );
    }
    
    // Platform-specific response optimizations
    let responseData: any = result;
    
    if (clientInfo.type === 'mobile') {
      // Mobile needs tokens and minimal user data
      responseData = {
        user: {
          id: result.user?.id,
          email: result.user?.email,
          phone: result.user?.phone,
          name: result.user?.name,
          role: result.user?.role,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } else {
      // Web can handle full user data, but no tokens (uses sessions)
      responseData = {
        user: result.user,
        redirectUrl: result.redirectUrl || '/dashboard',
        sessionId: result.sessionId,
      };
    }
    
    return createUnifiedResponse(responseData, clientInfo, {
      status: 200,
      message: 'Login successful',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        clientInfo,
        400
      );
    }
    
    return createErrorResponse(
      'Internal server error',
      clientInfo,
      500
    );
  }
}