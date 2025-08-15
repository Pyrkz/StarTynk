import { NextRequest } from 'next/server';
import { authService } from '@repo/api/services';
import { ApiResponse } from '@repo/shared/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Try to get user from session first
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      // Session-based logout
      const body = await request.json().catch(() => ({}));
      await authService.logout(session.user.id, body.deviceId);
      
      return ApiResponse.success(null, {
        message: 'Logout successful',
      });
    }
    
    // If no session, check for bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponse.unauthorized('No authentication provided');
    }
    
    const token = authHeader.substring(7);
    const payload = await authService.verifyToken(token);
    
    const body = await request.json().catch(() => ({}));
    await authService.logout(payload.sub, body.deviceId);
    
    return ApiResponse.success(null, {
      message: 'Logout successful',
    });
  } catch (error) {
    return ApiResponse.fromError(error);
  }
}