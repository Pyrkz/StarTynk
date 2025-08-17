import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/web';
import { SyncService } from '@repo/features';
import { Logger } from '@repo/utils';

const logger = new Logger('MobileSyncPush');

const syncChangeSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.any(),
  clientTimestamp: z.string(),
});

const syncPushSchema = z.object({
  changes: z.array(syncChangeSchema).max(100, 'Maximum 100 changes per request'),
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
    const validated = syncPushSchema.parse(body);
    
    const syncService = new SyncService();
    const result = await syncService.pushChanges(auth.user.id, validated.changes);
    
    if (result.conflicts.length > 0) {
      logger.warn(`Sync push conflicts detected for user: ${auth.user.id}`, {
        conflictCount: result.conflicts.length,
        totalChanges: validated.changes.length,
      });
      
      return NextResponse.json(
        ApiResponse.success({
          success: false,
          conflicts: result.conflicts,
          message: 'Conflicts detected. Please resolve and retry.',
        }),
        { status: 409 }
      );
    }
    
    logger.info(`Sync push completed for user: ${auth.user.id}`, {
      changesCount: validated.changes.length,
    });
    
    return NextResponse.json(
      ApiResponse.success({
        success: true,
        appliedChanges: validated.changes.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Sync push validation error:', error.errors);
      return NextResponse.json(
        ApiResponse.error('Invalid request data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      );
    }
    
    logger.error('Sync push error:', error);
    return NextResponse.json(
      ApiResponse.error('Sync failed', 'SYNC_ERROR'),
      { status: 500 }
    );
  }
}