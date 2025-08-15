import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyOtpRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { normalizeEmail, normalizePhone, detectLoginMethod } from '@/lib/auth/validators';
import { generateAuthResponse, detectClientType } from '@/lib/auth/unified-auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = verifyOtpRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { identifier, otp, purpose } = validation.data;
    
    // Detect login method
    const loginMethod = detectLoginMethod(identifier);
    if (loginMethod === 'invalid') {
      return ApiResponse.badRequest('Invalid identifier format');
    }
    
    // Normalize identifier
    const normalizedIdentifier = loginMethod === 'email' 
      ? normalizeEmail(identifier)
      : normalizePhone(identifier);
    
    // Find OTP token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedIdentifier,
        token: otp,
      }
    });
    
    if (!verificationToken) {
      return ApiResponse.badRequest('Invalid OTP');
    }
    
    // Check if expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedIdentifier,
            token: otp,
          }
        }
      });
      return ApiResponse.badRequest('OTP has expired');
    }
    
    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedIdentifier,
          token: otp,
        }
      }
    });
    
    // Handle different purposes
    switch (purpose) {
      case 'login': {
        // Find user
        const user = await prisma.user.findFirst({
          where: loginMethod === 'email'
            ? { email: normalizedIdentifier }
            : { phone: normalizedIdentifier }
        });
        
        if (!user) {
          return ApiResponse.notFound('User not found');
        }
        
        // Mark as verified
        if (loginMethod === 'email' && !user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() }
          });
        } else if (loginMethod === 'phone' && !user.phoneVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: new Date() }
          });
        }
        
        // Generate auth response
        const clientType = detectClientType(request);
        const authResponse = await generateAuthResponse(
          user,
          clientType,
          loginMethod,
          undefined,
          request
        );
        
        return NextResponse.json(authResponse);
      }
      
      case 'verify': {
        // Find user and mark as verified
        const user = await prisma.user.findFirst({
          where: loginMethod === 'email'
            ? { email: normalizedIdentifier }
            : { phone: normalizedIdentifier }
        });
        
        if (!user) {
          return ApiResponse.notFound('User not found');
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: loginMethod === 'email'
            ? { emailVerified: new Date() }
            : { phoneVerified: new Date() }
        });
        
        return NextResponse.json({
          success: true,
          message: `${loginMethod === 'email' ? 'Email' : 'Phone'} verified successfully`,
        });
      }
      
      case 'reset_password': {
        // Return a token for password reset
        return NextResponse.json({
          success: true,
          message: 'OTP verified. You can now reset your password.',
          resetToken: 'TODO: Generate secure reset token',
        });
      }
      
      default:
        return ApiResponse.badRequest('Invalid purpose');
    }
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return ApiResponse.error('Failed to verify OTP');
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