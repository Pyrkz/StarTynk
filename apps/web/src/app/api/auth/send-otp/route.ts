import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { sendOtpRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { generateOTP, normalizeEmail, normalizePhone } from '@/lib/auth/validators';
import { rateLimitAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = sendOtpRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { identifier, type, purpose } = validation.data;
    
    // Rate limiting
    const rateLimitResponse = await rateLimitAuth(request, identifier);
    if (rateLimitResponse) return rateLimitResponse;
    
    // Normalize identifier
    const normalizedIdentifier = type === 'email' 
      ? normalizeEmail(identifier)
      : normalizePhone(identifier);
    
    // Check if user exists (for login/reset)
    if (purpose === 'login' || purpose === 'reset_password') {
      const user = await prisma.user.findFirst({
        where: type === 'email'
          ? { email: normalizedIdentifier }
          : { phone: normalizedIdentifier }
      });
      
      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({
          success: true,
          message: `OTP sent to ${type}`,
        });
      }
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedIdentifier,
        token: otp,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });
    
    // TODO: Send OTP via SMS/Email
    if (type === 'phone') {
      // Integrate with SMS provider (Twilio, AWS SNS, etc.)
      console.log(`[DEV] OTP for ${normalizedIdentifier}: ${otp}`);
    } else {
      // Send email
      console.log(`[DEV] OTP for ${normalizedIdentifier}: ${otp}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `OTP sent to ${type}`,
      // In development, return OTP (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return ApiResponse.error('Failed to send OTP');
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