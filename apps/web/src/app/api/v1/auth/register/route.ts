import { NextRequest } from 'next/server';
import { authService } from '@repo/api/services';
import { ApiResponse } from '@repo/shared/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.register(body);
    
    return ApiResponse.created(result, {
      message: 'Registration successful',
    });
  } catch (error) {
    return ApiResponse.fromError(error);
  }
}