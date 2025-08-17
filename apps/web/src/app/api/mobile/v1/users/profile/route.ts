import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/web';
import { MobileUserDTO } from '@repo/shared/types/dto/mobile';
import { Logger } from '@repo/utils';

const logger = new Logger('MobileUserProfile');

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        ApiResponse.error('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }
    
    // Create mobile user DTO
    const mobileUser: MobileUserDTO = {
      id: auth.user.id,
      name: auth.user.name || 'Unknown User',
      email: auth.user.email,
      role: auth.user.role,
      avatar: auth.user.image || undefined,
    };
    
    logger.debug(`Mobile profile fetched for user: ${auth.user.id}`);
    
    return NextResponse.json(
      ApiResponse.success(mobileUser),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching mobile user profile:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to fetch profile', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}