import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAuthService } from '@repo/auth';
import { detectClient, createUnifiedResponse, createErrorResponse } from '@/middleware/client-detection';
import type { RegisterRequest } from '@repo/shared/types';

// Validation schema
const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  loginMethod: z.enum(['email', 'phone']),
  deviceId: z.string().optional(),
  clientType: z.enum(['web', 'mobile']).optional(),
}).refine(
  (data) => {
    if (data.loginMethod === 'email') return !!data.email;
    if (data.loginMethod === 'phone') return !!data.phone;
    return false;
  },
  {
    message: 'Email is required for email registration, phone is required for phone registration',
    path: ['loginMethod'],
  }
);

/**
 * Unified registration endpoint
 * POST /api/v1/auth/unified-register - Register new user
 */
export async function POST(request: NextRequest) {
  const clientInfo = detectClient(request);
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    // Create register request
    const registerRequest: RegisterRequest = {
      email: validatedData.email,
      phone: validatedData.phone,
      password: validatedData.password,
      name: validatedData.name,
      loginMethod: validatedData.loginMethod,
      deviceId: validatedData.deviceId,
      clientType: clientInfo.type,
    };
    
    // Perform registration using unified auth service
    const authService = createAuthService();
    const result = await authService.register(registerRequest);
    
    if (!result.success) {
      return createErrorResponse(
        result.error || 'Registration failed',
        clientInfo,
        400
      );
    }
    
    // Platform-specific response optimizations
    let responseData: any = result;
    
    if (clientInfo.type === 'mobile') {
      // Mobile gets immediate login after registration
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
        message: 'Registration successful',
      };
    } else {
      // Web might redirect to verification page
      responseData = {
        user: result.user,
        redirectUrl: result.redirectUrl || '/verify-email',
        message: 'Registration successful. Please verify your email.',
      };
    }
    
    return createUnifiedResponse(responseData, clientInfo, {
      status: 201,
      message: 'Registration successful',
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
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