import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/api/response';
import { protectedRoute } from '@/lib/api/protected-route';
import { validateRequestBody } from '@/lib/api/validators';
import { createUserActivityLog } from '@/features/auth/utils/activity-logger';

// Optional: accept refresh token to revoke it
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
}).optional();

export const POST = protectedRoute(async (request: NextRequest, context, user) => {
  let body = null;
  
  // Try to parse body if present
  try {
    const rawBody = await request.text();
    if (rawBody) {
      body = JSON.parse(rawBody);
      body = logoutSchema.parse(body);
    }
  } catch {
    // Body is optional for logout
  }
  
  // If refresh token provided, delete it
  if (body?.refreshToken) {
    try {
      await prisma.refreshToken.deleteMany({
        where: {
          token: body.refreshToken,
          userId: user.id
        }
      });
    } catch (error) {
      // Ignore error - token might already be deleted
      console.error('Failed to delete refresh token:', error);
    }
  }

  // Optional: Delete all refresh tokens for the user (more secure)
  // This logs out the user from all devices
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id }
  });

  // Log logout
  await createUserActivityLog({
    userId: user.id,
    action: 'LOGOUT',
    details: { method: 'mobile' }
  });

  return ApiResponse.success({ 
    message: 'Logged out successfully' 
  });
});