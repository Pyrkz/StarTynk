import { NextRequest } from 'next/server';
import { authService } from '@repo/api/web';
import { ApiResponse } from '@/lib/api/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authService.register(body);
    
    return ApiResponse.success({
      ...result,
      message: 'Registration successful',
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return ApiResponse.error('Registration failed', 400);
  }
}