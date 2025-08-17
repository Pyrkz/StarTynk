/**
 * Cache analytics service for tracking cache performance
 * Provides insights into hit rates, bandwidth savings, and client patterns
 */

export interface CacheMetric {
  timestamp: Date;
  endpoint: string;
  clientType: string;
  hit: boolean;
  responseSize?: number;
  responseTime?: number;
  etag?: string;
  statusCode: number;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  bandwidthSaved: number;
  avgResponseTime: number;
  period: string;
}

export interface EndpointStats {
  endpoint: string;
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseSize: number;
  avgResponseTime: number;
}

export interface ClientTypeStats {
  clientType: string;
  requests: number;
  cacheHits: number;
  hitRate: number;
  bandwidthSaved: number;
}

export class CacheAnalyticsService {
  private static metrics: CacheMetric[] = [];
  private static readonly MAX_METRICS = 10000; // Keep last 10k metrics
  private static readonly METRIC_RETENTION_HOURS = 24; // Keep metrics for 24 hours
  
  /**
   * Record a cache hit
   */
  static recordHit(
    endpoint: string, 
    clientType: string, 
    options: {
      responseSize?: number;
      responseTime?: number;
      etag?: string;
      statusCode?: number;
    } = {}
  ): void {
    this.addMetric({
      timestamp: new Date(),
      endpoint,
      clientType,
      hit: true,
      responseSize: options.responseSize,
      responseTime: options.responseTime,
      etag: options.etag,
      statusCode: options.statusCode || 304, // 304 for cache hits
    });
  }

  /**
   * Record a cache miss
   */
  static recordMiss(
    endpoint: string, 
    clientType: string,
    options: {
      responseSize?: number;
      responseTime?: number;
      statusCode?: number;
    } = {}
  ): void {
    this.addMetric({
      timestamp: new Date(),
      endpoint,
      clientType,
      hit: false,
      responseSize: options.responseSize,
      responseTime: options.responseTime,
      statusCode: options.statusCode || 200,
    });
  }

  /**
   * Get bandwidth saved by caching
   */
  static getBandwidthSaved(period?: string): number {
    const metrics = this.getMetricsForPeriod(period);
    
    // Calculate bandwidth saved from cache hits
    return metrics
      .filter(m => m.hit && m.responseSize)
      .reduce((total, m) => total + (m.responseSize || 0), 0);
  }

  /**
   * Get cache hit ratio
   */
  static getHitRatio(period?: string): number {
    const metrics = this.getMetricsForPeriod(period);
    
    if (metrics.length === 0) return 0;
    
    const hits = metrics.filter(m => m.hit).length;
    return hits / metrics.length;
  }

  /**
   * Get comprehensive cache statistics
   */
  static getStats(period?: string): CacheStats {
    const metrics = this.getMetricsForPeriod(period);
    
    const hits = metrics.filter(m => m.hit);
    const misses = metrics.filter(m => !m.hit);
    
    const totalHits = hits.length;
    const totalMisses = misses.length;
    const total = totalHits + totalMisses;
    
    const hitRate = total > 0 ? totalHits / total : 0;
    const missRate = total > 0 ? totalMisses / total : 0;
    
    const bandwidthSaved = hits.reduce((sum, m) => sum + (m.responseSize || 0), 0);
    
    const avgResponseTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / metrics.length
      : 0;
    
    return {
      hitRate,
      missRate,
      totalHits,
      totalMisses,
      bandwidthSaved,
      avgResponseTime,
      period: period || 'all',
    };
  }

  /**
   * Get statistics by endpoint
   */
  static getStatsByEndpoint(period?: string): EndpointStats[] {
    const metrics = this.getMetricsForPeriod(period);
    const endpointMap = new Map<string, CacheMetric[]>();
    
    // Group metrics by endpoint
    metrics.forEach(m => {
      const list = endpointMap.get(m.endpoint) || [];
      list.push(m);
      endpointMap.set(m.endpoint, list);
    });
    
    // Calculate stats for each endpoint
    const stats: EndpointStats[] = [];
    
    endpointMap.forEach((endpointMetrics, endpoint) => {
      const hits = endpointMetrics.filter(m => m.hit).length;
      const misses = endpointMetrics.filter(m => !m.hit).length;
      const total = hits + misses;
      
      const avgResponseSize = endpointMetrics
        .filter(m => m.responseSize)
        .reduce((sum, m, _, arr) => sum + (m.responseSize || 0) / arr.length, 0);
      
      const avgResponseTime = endpointMetrics
        .filter(m => m.responseTime)
        .reduce((sum, m, _, arr) => sum + (m.responseTime || 0) / arr.length, 0);
      
      stats.push({
        endpoint,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        avgResponseSize,
        avgResponseTime,
      });
    });
    
    // Sort by request count
    return stats.sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses));
  }

  /**
   * Get statistics by client type
   */
  static getStatsByClientType(period?: string): ClientTypeStats[] {
    const metrics = this.getMetricsForPeriod(period);
    const clientMap = new Map<string, CacheMetric[]>();
    
    // Group metrics by client type
    metrics.forEach(m => {
      const list = clientMap.get(m.clientType) || [];
      list.push(m);
      clientMap.set(m.clientType, list);
    });
    
    // Calculate stats for each client type
    const stats: ClientTypeStats[] = [];
    
    clientMap.forEach((clientMetrics, clientType) => {
      const hits = clientMetrics.filter(m => m.hit);
      const requests = clientMetrics.length;
      const cacheHits = hits.length;
      
      const bandwidthSaved = hits.reduce((sum, m) => sum + (m.responseSize || 0), 0);
      
      stats.push({
        clientType,
        requests,
        cacheHits,
        hitRate: requests > 0 ? cacheHits / requests : 0,
        bandwidthSaved,
      });
    });
    
    return stats.sort((a, b) => b.requests - a.requests);
  }

  /**
   * Get cache performance trends
   */
  static getTrends(hours = 24, interval = 1): Array<{
    time: string;
    hitRate: number;
    requests: number;
    bandwidthSaved: number;
  }> {
    const now = new Date();
    const trends = [];
    
    for (let i = hours - 1; i >= 0; i -= interval) {
      const startTime = new Date(now.getTime() - (i + interval) * 60 * 60 * 1000);
      const endTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      const periodMetrics = this.metrics.filter(m => 
        m.timestamp >= startTime && m.timestamp < endTime
      );
      
      const hits = periodMetrics.filter(m => m.hit).length;
      const requests = periodMetrics.length;
      const bandwidthSaved = periodMetrics
        .filter(m => m.hit)
        .reduce((sum, m) => sum + (m.responseSize || 0), 0);
      
      trends.push({
        time: startTime.toISOString(),
        hitRate: requests > 0 ? hits / requests : 0,
        requests,
        bandwidthSaved,
      });
    }
    
    return trends;
  }

  /**
   * Get popular cache keys
   */
  static getPopularCacheKeys(limit = 10, period?: string): Array<{
    endpoint: string;
    etag: string;
    hits: number;
  }> {
    const metrics = this.getMetricsForPeriod(period);
    const keyMap = new Map<string, number>();
    
    metrics
      .filter(m => m.hit && m.etag)
      .forEach(m => {
        const key = `${m.endpoint}:${m.etag}`;
        keyMap.set(key, (keyMap.get(key) || 0) + 1);
      });
    
    return Array.from(keyMap.entries())
      .map(([key, hits]) => {
        const [endpoint, etag] = key.split(':');
        return { endpoint, etag, hits };
      })
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Export analytics data
   */
  static exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const stats = {
      summary: this.getStats(),
      byEndpoint: this.getStatsByEndpoint(),
      byClientType: this.getStatsByClientType(),
      trends: this.getTrends(),
      popularKeys: this.getPopularCacheKeys(),
      exportDate: new Date().toISOString(),
    };
    
    if (format === 'json') {
      return JSON.stringify(stats, null, 2);
    }
    
    // CSV export
    const csv: string[] = [];
    csv.push('Cache Analytics Export');
    csv.push(`Export Date: ${stats.exportDate}`);
    csv.push('');
    
    // Summary
    csv.push('Summary Statistics');
    csv.push('Metric,Value');
    csv.push(`Hit Rate,${(stats.summary.hitRate * 100).toFixed(2)}%`);
    csv.push(`Total Hits,${stats.summary.totalHits}`);
    csv.push(`Total Misses,${stats.summary.totalMisses}`);
    csv.push(`Bandwidth Saved,${this.formatBytes(stats.summary.bandwidthSaved)}`);
    csv.push('');
    
    // By Endpoint
    csv.push('Statistics by Endpoint');
    csv.push('Endpoint,Hits,Misses,Hit Rate,Avg Size,Avg Time');
    stats.byEndpoint.forEach(ep => {
      csv.push([
        ep.endpoint,
        ep.hits,
        ep.misses,
        `${(ep.hitRate * 100).toFixed(2)}%`,
        this.formatBytes(ep.avgResponseSize),
        `${ep.avgResponseTime.toFixed(2)}ms`,
      ].join(','));
    });
    
    return csv.join('\n');
  }

  /**
   * Clear old metrics
   */
  static cleanup(): void {
    const cutoff = new Date(Date.now() - this.METRIC_RETENTION_HOURS * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Reset all analytics
   */
  static reset(): void {
    this.metrics = [];
  }

  /**
   * Add metric and maintain size limit
   */
  private static addMetric(metric: CacheMetric): void {
    this.metrics.push(metric);
    
    // Maintain size limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    // Clean old metrics periodically
    if (this.metrics.length % 1000 === 0) {
      this.cleanup();
    }
  }

  /**
   * Get metrics for a specific period
   */
  private static getMetricsForPeriod(period?: string): CacheMetric[] {
    if (!period) return this.metrics;
    
    const now = new Date();
    let cutoff: Date;
    
    switch (period) {
      case 'hour':
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return this.metrics;
    }
    
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get real-time cache metrics for monitoring
   */
  static getRealTimeMetrics(): {
    lastMinuteHitRate: number;
    lastMinuteRequests: number;
    currentQPS: number;
    activeCacheKeys: number;
  } {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const lastMinuteMetrics = this.metrics.filter(m => m.timestamp >= oneMinuteAgo);
    
    const hits = lastMinuteMetrics.filter(m => m.hit).length;
    const requests = lastMinuteMetrics.length;
    
    // Count unique ETags in last minute
    const uniqueETags = new Set(
      lastMinuteMetrics
        .filter(m => m.etag)
        .map(m => `${m.endpoint}:${m.etag}`)
    );
    
    return {
      lastMinuteHitRate: requests > 0 ? hits / requests : 0,
      lastMinuteRequests: requests,
      currentQPS: requests / 60, // Queries per second
      activeCacheKeys: uniqueETags.size,
    };
  }
}