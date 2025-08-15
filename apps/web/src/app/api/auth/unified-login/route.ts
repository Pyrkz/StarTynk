import { NextRequest, NextResponse } from 'next/server';
import { 
  detectClientType, 
  validateCredentials, 
  generateAuthResponse,
  createSecurityContext,
  extractDeviceId,
  getCorsHeaders
} from '@repo/auth';
import { unifiedLoginRequestSchema } from '@repo/shared/types';
import { ApiResponse } from '@/lib/api/api-response';

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
    
    if (!user || loginMethod === 'invalid') {
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
    
    // Create security context
    const securityContext = createSecurityContext({
      'user-agent': request.headers.get('user-agent') || undefined,
      'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
      'x-real-ip': request.headers.get('x-real-ip') || undefined,
    }, deviceId || extractDeviceId(request), loginMethod);
    
    // Generate auth response
    const authResponse = await generateAuthResponse(
      user, 
      clientType, 
      loginMethod, 
      securityContext
    );
    
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error('Login failed');
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}