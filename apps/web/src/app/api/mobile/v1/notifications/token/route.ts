import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/responses';
import { PushNotificationService } from '@repo/features/services/notifications';
import { Logger } from '@repo/utils/logger';

const logger = new Logger('PushTokenRegistration');

const registerTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  platform: z.enum(['IOS', 'ANDROID']),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        ApiResponse.error('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validated = registerTokenSchema.parse(body);
    
    const pushService = new PushNotificationService();
    await pushService.registerToken(auth.user.id, validated.token, {
      deviceId: validated.deviceId,
      platform: validated.platform,
      deviceName: validated.deviceName,
      appVersion: validated.appVersion,
      osVersion: validated.osVersion,
    });
    
    logger.info(`Push token registered for user: ${auth.user.id}`, {
      deviceId: validated.deviceId,
      platform: validated.platform,
    });
    
    return NextResponse.json(
      ApiResponse.success({ registered: true }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Push token registration validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Push token registration error:', error);
    return NextResponse.json(
      ApiResponse.error('Token registration failed', 'REGISTRATION_ERROR'),
      { status: 500 }
    );
  }
}