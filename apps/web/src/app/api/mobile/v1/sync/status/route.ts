import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { authenticateRequest } from '@repo/auth';
import { ApiResponse } from '@repo/api/web';
import { Logger } from '@repo/utils';

const logger = new Logger('MobileSyncStatus');

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
    
    // Get sync queue status
    const queueStatus = await prisma.syncQueue.groupBy({
      by: ['status'],
      where: { userId: auth.user.id },
      _count: true,
    });
    
    const statusCounts = queueStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);
    
    // Get last successful sync
    const lastSync = await prisma.syncQueue.findFirst({
      where: {
        userId: auth.user.id,
        status: 'COMPLETED',
      },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });
    
    // Get pending count
    const pendingCount = statusCounts.PENDING || 0;
    const failedCount = statusCounts.FAILED || 0;
    
    const response = {
      hasPendingChanges: pendingCount > 0,
      pendingCount,
      failedCount,
      lastSyncAt: lastSync?.syncedAt?.toISOString(),
      queueStatus: statusCounts,
    };
    
    logger.debug(`Sync status checked for user: ${auth.user.id}`, response);
    
    return NextResponse.json(
      ApiResponse.success(response),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error checking sync status:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to check sync status', 'SYNC_STATUS_ERROR'),
      { status: 500 }
    );
  }
}