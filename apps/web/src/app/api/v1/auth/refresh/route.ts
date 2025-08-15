import { NextRequest } from 'next/server';
import { authService } from '@repo/api/services';
import { ApiResponse } from '@repo/shared/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokens = await authService.refreshToken(body);
    
    return ApiResponse.success(tokens, {
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return ApiResponse.fromError(error);
  }
}