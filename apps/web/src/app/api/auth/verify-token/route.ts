import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/unified-auth';
import { verifyTokenRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { prisma } from '@repo/database';
import type { VerifyTokenResponse } from '@repo/shared/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = verifyTokenRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { token, type } = validation.data;
    
    try {
      // Select the right secret based on token type
      const secret = type === 'refresh' 
        ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!)
        : process.env.JWT_SECRET!;
      
      // Verify token
      const payload = verifyToken(token, secret) as any;
      
      // For refresh tokens, check if it exists in database
      if (type === 'refresh') {
        const storedToken = await prisma.refreshToken.findUnique({
          where: { token },
          include: { user: true }
        });
        
        if (!storedToken) {
          const response: VerifyTokenResponse = {
            success: true,
            valid: false,
            expired: false,
          };
          return NextResponse.json(response);
        }
        
        // Check if expired
        const expired = storedToken.expiresAt < new Date();
        
        const response: VerifyTokenResponse = {
          success: true,
          valid: !expired,
          expired,
          user: expired ? undefined : {
            id: storedToken.user.id,
            email: storedToken.user.email || undefined,
            phone: storedToken.user.phone || undefined,
            name: storedToken.user.name || undefined,
            role: storedToken.user.role,
            emailVerified: !!storedToken.user.emailVerified,
            phoneVerified: !!storedToken.user.phoneVerified,
          },
        };
        
        return NextResponse.json(response);
      }
      
      // For access tokens, get user from payload
      if (payload.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId }
        });
        
        if (user) {
          const response: VerifyTokenResponse = {
            success: true,
            valid: true,
            expired: false,
            user: {
              id: user.id,
              email: user.email || undefined,
              phone: user.phone || undefined,
              name: user.name || undefined,
              role: user.role,
              emailVerified: !!user.emailVerified,
              phoneVerified: !!user.phoneVerified,
            },
          };
          return NextResponse.json(response);
        }
      }
      
      // Token is valid but user not found
      const response: VerifyTokenResponse = {
        success: true,
        valid: true,
        expired: false,
      };
      return NextResponse.json(response);
      
    } catch (error: any) {
      // Token verification failed
      const expired = error.name === 'TokenExpiredError';
      const response: VerifyTokenResponse = {
        success: true,
        valid: false,
        expired,
      };
      return NextResponse.json(response);
    }
    
  } catch (error) {
    console.error('Token verification error:', error);
    return ApiResponse.error('Token verification failed');
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