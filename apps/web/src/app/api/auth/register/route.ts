import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import { unifiedRegisterRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';
import { normalizeEmail, normalizePhone, validatePassword, validateEmail, validatePhone } from '@/lib/auth/validators';
import { detectClientType, generateAuthResponse } from '@/lib/auth/unified-auth';
import { logUserActivity } from '@/features/auth/utils/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    const validation = unifiedRegisterRequestSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest('Invalid request', validation.error.errors);
    }
    
    const { email, phone, password, name } = validation.data;
    
    // Validate at least one identifier
    if (!email && !phone) {
      return ApiResponse.badRequest('Email or phone number is required');
    }
    
    // Validate email format if provided
    if (email && !validateEmail(email)) {
      return ApiResponse.badRequest('Invalid email format');
    }
    
    // Validate phone format if provided
    if (phone && !validatePhone(phone)) {
      return ApiResponse.badRequest('Invalid phone number format');
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return ApiResponse.badRequest(passwordValidation.errors.join('. '));
    }
    
    // Normalize identifiers
    const normalizedEmail = email ? normalizeEmail(email) : null;
    const normalizedPhone = phone ? normalizePhone(phone) : null;
    
    // Check for existing users
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          normalizedEmail ? { email: normalizedEmail } : null,
          normalizedPhone ? { phone: normalizedPhone } : null,
        ].filter(Boolean) as any
      }
    });
    
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return ApiResponse.conflict('Email is already registered');
      }
      if (existingUser.phone === normalizedPhone) {
        return ApiResponse.conflict('Phone number is already registered');
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        name,
        emailVerified: null, // Needs verification
        phoneVerified: null, // Needs verification
      }
    });
    
    // TODO: Send verification email/SMS
    if (normalizedEmail) {
      // await sendEmailVerification(user.id, normalizedEmail);
    }
    if (normalizedPhone) {
      // await sendPhoneVerification(user.id, normalizedPhone);
    }
    
    // Log registration
    await logUserActivity({
      userId: user.id,
      action: 'REGISTER',
      details: JSON.stringify({ 
        hasEmail: !!email,
        hasPhone: !!phone,
        clientType: detectClientType(request)
      }),
      ipAddress: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
    });
    
    // Detect client type
    const clientType = detectClientType(request);
    const loginMethod = email ? 'email' : 'phone';
    
    // For mobile, auto-login after registration
    if (clientType === 'mobile') {
      const authResponse = await generateAuthResponse(
        user,
        clientType,
        loginMethod,
        undefined,
        request
      );
      return NextResponse.json(authResponse);
    }
    
    // For web, return success message
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please verify your account.',
      userId: user.id,
      requiresVerification: true,
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return ApiResponse.error('Registration failed');
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