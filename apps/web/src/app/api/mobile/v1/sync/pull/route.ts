import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/web';
import { SyncService } from '@repo/features';
import { Logger } from '@repo/utils';

const logger = new Logger('MobileSyncPull');

const syncPullSchema = z.object({
  lastSyncAt: z.string().optional(),
  entities: z.array(z.string()).min(1, 'At least one entity is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
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
    const validated = syncPullSchema.parse(body);
    
    const syncService = new SyncService();
    const response = await syncService.pullChanges(auth.user.id, validated);
    
    logger.info(`Sync pull completed for user: ${auth.user.id}`, {
      entities: validated.entities,
      changesCount: Object.values(response.changes.created).reduce((acc, arr) => acc + arr.length, 0) +
                   Object.values(response.changes.updated).reduce((acc, arr) => acc + arr.length, 0) +
                   Object.values(response.changes.deleted).reduce((acc, arr) => acc + arr.length, 0),
    });
    
    return NextResponse.json(
      ApiResponse.success(response),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Sync pull validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Sync pull error:', error);
    return NextResponse.json(
      ApiResponse.error('Sync failed', 'SYNC_ERROR'),
      { status: 500 }
    );
  }
}