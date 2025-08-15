import { NextRequest } from 'next/server';
import { ApiResponse } from '@repo/shared/utils';
import { prisma } from '@repo/database';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return ApiResponse.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
      version: 'v1',
    });
  } catch (error) {
    return ApiResponse.error('Service unhealthy', 503, 'SERVICE_UNAVAILABLE', {
      database: 'disconnected',
    });
  }
}