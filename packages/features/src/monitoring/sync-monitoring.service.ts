import { prisma } from '@repo/database';
import { EventEmitter } from 'events';

export interface SyncMetrics {
  timestamp: Date;
  userId?: string;
  deviceId?: string;
  
  // Performance metrics
  syncDuration: number;
  itemsProcessed: number;
  successRate: number;
  averageItemTime: number;
  
  // Network metrics
  bytesUploaded: number;
  bytesDownloaded: number;
  networkLatency: number;
  
  // Error metrics
  errorCount: number;
  conflictCount: number;
  retryCount: number;
  
  // Queue metrics
  queueSize: number;
  pendingItems: number;
  failedItems: number;
}

export interface NotificationMetrics {
  timestamp: Date;
  
  // Delivery metrics
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  
  // Token metrics
  activeTokens: number;
  failedTokens: number;
  platformBreakdown: Record<string, number>;
  
  // Engagement metrics
  readRate: number;
  tapRate: number;
  dismissRate: number;
}

export interface CacheMetrics {
  timestamp: Date;
  
  // Performance metrics
  hitRate: number;
  missRate: number;
  evictionRate: number;
  
  // Storage metrics
  totalSize: number;
  itemCount: number;
  averageItemSize: number;
  
  // Entity breakdown
  entityMetrics: Record<string, {
    hitRate: number;
    itemCount: number;
    totalSize: number;
  }>;
}

export class SyncMonitoringService extends EventEmitter {
  private static instance: SyncMonitoringService;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private alertThresholds = {
    syncFailureRate: 0.1, // 10%
    notificationFailureRate: 0.05, // 5%
    cacheHitRate: 0.7, // 70% minimum
    syncDuration: 5000, // 5 seconds
    queueSize: 1000,
    networkLatency: 2000, // 2 seconds
  };
  
  private constructor() {
    super();
  }
  
  static getInstance(): SyncMonitoringService {
    if (!SyncMonitoringService.instance) {
      SyncMonitoringService.instance = new SyncMonitoringService();
    }
    return SyncMonitoringService.instance;
  }
  
  startMonitoring(intervalMs: number = 60000): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.metricsInterval = setInterval(() => {
      this.collectAndReportMetrics().catch(console.error);
    }, intervalMs);
    
    // Collect initial metrics
    this.collectAndReportMetrics().catch(console.error);
  }
  
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
  
  private async collectAndReportMetrics(): Promise<void> {
    const [syncMetrics, notificationMetrics, cacheMetrics] = await Promise.all([
      this.collectSyncMetrics(),
      this.collectNotificationMetrics(),
      this.collectCacheMetrics(),
    ]);
    
    // Check for alerts
    this.checkAlerts(syncMetrics, notificationMetrics, cacheMetrics);
    
    // Emit metrics
    this.emit('metrics:collected', {
      sync: syncMetrics,
      notifications: notificationMetrics,
      cache: cacheMetrics,
    });
  }
  
  private async collectSyncMetrics(): Promise<SyncMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get sync logs from the last hour
    const syncLogs = await prisma.syncLog.findMany({
      where: {
        startedAt: { gte: oneHourAgo },
      },
    });
    
    // Get queue stats
    const [pendingCount, failedCount, totalCount] = await Promise.all([
      prisma.syncQueue.count({ where: { status: 'PENDING' } }),
      prisma.syncQueue.count({ where: { status: 'FAILED' } }),
      prisma.syncQueue.count(),
    ]);
    
    // Calculate metrics
    const successfulSyncs = syncLogs.filter(log => log.status === 'SUCCESS');
    const totalDuration = successfulSyncs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalItems = successfulSyncs.reduce((sum, log) => {
      const counts = log.entityCounts as Record<string, number>;
      return sum + Object.values(counts).reduce((a, b) => a + b, 0);
    }, 0);
    
    return {
      timestamp: now,
      syncDuration: successfulSyncs.length > 0 ? totalDuration / successfulSyncs.length : 0,
      itemsProcessed: totalItems,
      successRate: syncLogs.length > 0 ? successfulSyncs.length / syncLogs.length : 1,
      averageItemTime: totalItems > 0 ? totalDuration / totalItems : 0,
      bytesUploaded: 0, // Would need to track this separately
      bytesDownloaded: 0, // Would need to track this separately
      networkLatency: 0, // Would need to measure this
      errorCount: syncLogs.filter(log => log.status === 'FAILED').length,
      conflictCount: syncLogs.filter(log => log.status === 'CONFLICT').length,
      retryCount: await prisma.syncQueue.count({ where: { retryCount: { gt: 0 } } }),
      queueSize: totalCount,
      pendingItems: pendingCount,
      failedItems: failedCount,
    };
  }
  
  private async collectNotificationMetrics(): Promise<NotificationMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get notification logs from the last hour
    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
      },
    });
    
    // Get token stats
    const tokens = await prisma.pushToken.findMany({
      where: { isActive: true },
    });
    
    // Calculate metrics
    const sent = notificationLogs.filter(log => log.status === 'SENT');
    const delivered = notificationLogs.filter(log => log.status === 'DELIVERED');
    const read = notificationLogs.filter(log => log.status === 'READ');
    const failed = notificationLogs.filter(log => log.status === 'FAILED');
    
    const platformBreakdown: Record<string, number> = {};
    tokens.forEach(token => {
      platformBreakdown[token.platform] = (platformBreakdown[token.platform] || 0) + 1;
    });
    
    const deliveryTimes = delivered
      .filter(log => log.sentAt && log.deliveredAt)
      .map(log => log.deliveredAt!.getTime() - log.sentAt!.getTime());
    
    return {
      timestamp: now,
      sentCount: sent.length,
      deliveredCount: delivered.length,
      failedCount: failed.length,
      deliveryRate: sent.length > 0 ? delivered.length / sent.length : 0,
      averageDeliveryTime: deliveryTimes.length > 0 
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length 
        : 0,
      activeTokens: tokens.filter(t => t.isActive).length,
      failedTokens: tokens.filter(t => t.failureCount > 3).length,
      platformBreakdown,
      readRate: delivered.length > 0 ? read.length / delivered.length : 0,
      tapRate: 0, // Would need to track this
      dismissRate: 0, // Would need to track this
    };
  }
  
  private async collectCacheMetrics(): Promise<CacheMetrics> {
    // This would integrate with the cache manager
    // For now, return placeholder data
    return {
      timestamp: new Date(),
      hitRate: 0.85,
      missRate: 0.15,
      evictionRate: 0.05,
      totalSize: 1024 * 1024 * 10, // 10MB
      itemCount: 500,
      averageItemSize: 1024 * 20, // 20KB
      entityMetrics: {
        user: {
          hitRate: 0.95,
          itemCount: 50,
          totalSize: 1024 * 1024,
        },
        project: {
          hitRate: 0.8,
          itemCount: 100,
          totalSize: 1024 * 1024 * 2,
        },
        attendance: {
          hitRate: 0.75,
          itemCount: 200,
          totalSize: 1024 * 1024 * 3,
        },
      },
    };
  }
  
  private checkAlerts(
    syncMetrics: SyncMetrics,
    notificationMetrics: NotificationMetrics,
    cacheMetrics: CacheMetrics
  ): void {
    const alerts: Array<{
      type: string;
      severity: 'warning' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }> = [];
    
    // Sync alerts
    if (syncMetrics.successRate < (1 - this.alertThresholds.syncFailureRate)) {
      alerts.push({
        type: 'sync_failure_rate',
        severity: 'critical',
        message: `Sync failure rate is ${((1 - syncMetrics.successRate) * 100).toFixed(1)}%`,
        metric: 'successRate',
        value: syncMetrics.successRate,
        threshold: 1 - this.alertThresholds.syncFailureRate,
      });
    }
    
    if (syncMetrics.syncDuration > this.alertThresholds.syncDuration) {
      alerts.push({
        type: 'sync_duration',
        severity: 'warning',
        message: `Average sync duration is ${(syncMetrics.syncDuration / 1000).toFixed(1)}s`,
        metric: 'syncDuration',
        value: syncMetrics.syncDuration,
        threshold: this.alertThresholds.syncDuration,
      });
    }
    
    if (syncMetrics.queueSize > this.alertThresholds.queueSize) {
      alerts.push({
        type: 'queue_size',
        severity: 'warning',
        message: `Sync queue size is ${syncMetrics.queueSize} items`,
        metric: 'queueSize',
        value: syncMetrics.queueSize,
        threshold: this.alertThresholds.queueSize,
      });
    }
    
    // Notification alerts
    if (notificationMetrics.deliveryRate < (1 - this.alertThresholds.notificationFailureRate)) {
      alerts.push({
        type: 'notification_failure_rate',
        severity: 'critical',
        message: `Notification delivery rate is ${(notificationMetrics.deliveryRate * 100).toFixed(1)}%`,
        metric: 'deliveryRate',
        value: notificationMetrics.deliveryRate,
        threshold: 1 - this.alertThresholds.notificationFailureRate,
      });
    }
    
    // Cache alerts
    if (cacheMetrics.hitRate < this.alertThresholds.cacheHitRate) {
      alerts.push({
        type: 'cache_hit_rate',
        severity: 'warning',
        message: `Cache hit rate is ${(cacheMetrics.hitRate * 100).toFixed(1)}%`,
        metric: 'hitRate',
        value: cacheMetrics.hitRate,
        threshold: this.alertThresholds.cacheHitRate,
      });
    }
    
    // Emit alerts
    if (alerts.length > 0) {
      this.emit('alerts:triggered', alerts);
    }
  }
  
  // Manual metric reporting
  async reportSyncComplete(
    userId: string,
    deviceId: string,
    duration: number,
    itemCount: number,
    success: boolean
  ): Promise<void> {
    this.emit('sync:completed', {
      userId,
      deviceId,
      duration,
      itemCount,
      success,
      timestamp: new Date(),
    });
  }
  
  async reportNotificationSent(
    userId: string,
    notificationType: string,
    success: boolean
  ): Promise<void> {
    this.emit('notification:sent', {
      userId,
      notificationType,
      success,
      timestamp: new Date(),
    });
  }
  
  async reportCacheHit(entityType: string, hit: boolean): Promise<void> {
    this.emit('cache:access', {
      entityType,
      hit,
      timestamp: new Date(),
    });
  }
  
  // Get dashboard data
  async getDashboardData(): Promise<{
    sync: SyncMetrics;
    notifications: NotificationMetrics;
    cache: CacheMetrics;
    recentAlerts: any[];
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      score: number;
      issues: string[];
    };
  }> {
    const [sync, notifications, cache] = await Promise.all([
      this.collectSyncMetrics(),
      this.collectNotificationMetrics(),
      this.collectCacheMetrics(),
    ]);
    
    // Calculate system health
    const issues: string[] = [];
    let healthScore = 100;
    
    if (sync.successRate < 0.9) {
      issues.push('High sync failure rate');
      healthScore -= 20;
    }
    
    if (notifications.deliveryRate < 0.95) {
      issues.push('Low notification delivery rate');
      healthScore -= 15;
    }
    
    if (cache.hitRate < 0.7) {
      issues.push('Low cache hit rate');
      healthScore -= 10;
    }
    
    if (sync.queueSize > 1000) {
      issues.push('Large sync queue backlog');
      healthScore -= 10;
    }
    
    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';
    
    return {
      sync,
      notifications,
      cache,
      recentAlerts: [], // Would fetch from a persistent store
      systemHealth: {
        status,
        score: healthScore,
        issues,
      },
    };
  }
}

export const syncMonitoring = SyncMonitoringService.getInstance();