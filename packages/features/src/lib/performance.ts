import { QueryClient } from '@tanstack/react-query';

export interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  slowQueries: string[];
  errorRate: number;
  memoryUsage?: number;
  renderTime?: number;
}

export interface QueryPerformanceData {
  queryKey: string;
  duration: number;
  fromCache: boolean;
  error?: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    slowQueries: [],
    errorRate: 0,
  };

  private responseTimes: number[] = [];
  private errors = 0;
  private readonly SLOW_QUERY_THRESHOLD = 2000; // 2 seconds
  private readonly MAX_RESPONSE_TIMES = 100; // Keep only last 100 response times
  private readonly MAX_SLOW_QUERIES = 20; // Keep only last 20 slow queries

  private queryHistory: QueryPerformanceData[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  trackApiCall(duration: number, queryKey: string, fromCache: boolean, error?: boolean) {
    this.metrics.apiCalls++;
    
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    if (error) {
      this.errors++;
    }

    this.responseTimes.push(duration);
    
    // Update average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      const slowQueryEntry = `${queryKey} (${duration}ms)`;
      this.metrics.slowQueries.unshift(slowQueryEntry);
      
      // Keep only recent slow queries
      if (this.metrics.slowQueries.length > this.MAX_SLOW_QUERIES) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(0, this.MAX_SLOW_QUERIES);
      }
    }

    // Update error rate
    this.metrics.errorRate = (this.errors / this.metrics.apiCalls) * 100;

    // Keep only recent response times
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }

    // Track in history
    this.queryHistory.unshift({
      queryKey,
      duration,
      fromCache,
      error: error || false,
      timestamp: Date.now(),
    });

    // Keep history size manageable
    if (this.queryHistory.length > this.MAX_HISTORY_SIZE) {
      this.queryHistory = this.queryHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
  }

  trackError() {
    this.errors++;
    if (this.metrics.apiCalls > 0) {
      this.metrics.errorRate = (this.errors / this.metrics.apiCalls) * 100;
    }
  }

  trackMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
    }
  }

  trackRenderTime(componentName: string, renderTime: number) {
    this.metrics.renderTime = renderTime;
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  getMetrics(): PerformanceMetrics {
    this.trackMemoryUsage();
    return { ...this.metrics };
  }

  getCacheHitRate(): number {
    if (this.metrics.apiCalls === 0) return 0;
    return (this.metrics.cacheHits / this.metrics.apiCalls) * 100;
  }

  getSlowQueriesCount(): number {
    return this.metrics.slowQueries.length;
  }

  getRecentQueries(limit: number = 10): QueryPerformanceData[] {
    return this.queryHistory.slice(0, limit);
  }

  getWorstPerformingQueries(limit: number = 5): QueryPerformanceData[] {
    return [...this.queryHistory]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getQueryStats(queryKey: string) {
    const queries = this.queryHistory.filter(q => q.queryKey === queryKey);
    
    if (queries.length === 0) {
      return null;
    }

    const durations = queries.map(q => q.duration);
    const errors = queries.filter(q => q.error).length;
    const cacheHits = queries.filter(q => q.fromCache).length;

    return {
      totalCalls: queries.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      errorRate: (errors / queries.length) * 100,
      cacheHitRate: (cacheHits / queries.length) * 100,
      lastCalled: Math.max(...queries.map(q => q.timestamp)),
    };
  }

  reset() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      slowQueries: [],
      errorRate: 0,
    };
    this.responseTimes = [];
    this.errors = 0;
    this.queryHistory = [];
  }

  // Get performance summary for logging
  getSummary() {
    return {
      'API Calls': this.metrics.apiCalls,
      'Cache Hit Rate': `${this.getCacheHitRate().toFixed(2)}%`,
      'Avg Response Time': `${this.metrics.averageResponseTime.toFixed(2)}ms`,
      'Error Rate': `${this.metrics.errorRate.toFixed(2)}%`,
      'Slow Queries': this.metrics.slowQueries.length,
      'Memory Usage': this.metrics.memoryUsage ? `${this.metrics.memoryUsage.toFixed(2)}MB` : 'N/A',
    };
  }

  // Log performance metrics to console
  logMetrics() {
    console.group('📊 Performance Metrics');
    console.table(this.getSummary());
    
    if (this.metrics.slowQueries.length > 0) {
      console.group('🐌 Slow Queries');
      this.metrics.slowQueries.forEach(query => console.warn(query));
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // Export metrics for external monitoring
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      recentQueries: this.getRecentQueries(20),
      worstQueries: this.getWorstPerformingQueries(10),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook into React Query for automatic performance tracking
export function setupPerformanceMonitoring(queryClient: QueryClient) {
  // Monitor query execution
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated') {
      const query = event.query;
      const queryKey = query.queryKey.join(':');
      
      if (event.action.type === 'success') {
        const duration = Date.now() - (query.state.dataUpdatedAt || Date.now());
        const fromCache = query.state.fetchStatus === 'idle' && query.state.dataUpdatedAt > 0;
        
        performanceMonitor.trackApiCall(duration, queryKey, fromCache, false);
      }

      if (event.action.type === 'error') {
        performanceMonitor.trackError();
        
        // Track the failed query
        const duration = Date.now() - (query.state.errorUpdatedAt || Date.now());
        performanceMonitor.trackApiCall(duration, queryKey, false, true);
      }
    }
  });

  // Monitor mutations
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated') {
      const mutation = event.mutation;
      const mutationKey = mutation.options.mutationKey?.join(':') || 'unknown';
      
      if (event.action.type === 'success') {
        const duration = Date.now() - (mutation.state.submittedAt || Date.now());
        performanceMonitor.trackApiCall(duration, `mutation:${mutationKey}`, false, false);
      }

      if (event.action.type === 'error') {
        const duration = Date.now() - (mutation.state.submittedAt || Date.now());
        performanceMonitor.trackApiCall(duration, `mutation:${mutationKey}`, false, true);
        performanceMonitor.trackError();
      }
    }
  });

  // Log metrics periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      performanceMonitor.logMetrics();
    }, 60000); // Every minute
  }
}

// React hook for performance monitoring in components
export function usePerformanceMonitoring() {
  const getMetrics = () => performanceMonitor.getMetrics();
  const getCacheHitRate = () => performanceMonitor.getCacheHitRate();
  const getQueryStats = (queryKey: string) => performanceMonitor.getQueryStats(queryKey);
  const getSummary = () => performanceMonitor.getSummary();
  
  return {
    getMetrics,
    getCacheHitRate,
    getQueryStats,
    getSummary,
    trackRenderTime: performanceMonitor.trackRenderTime.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor),
  };
}

// Performance measurement hook for React components
export function useRenderTime(componentName: string) {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      performanceMonitor.trackRenderTime(componentName, renderTime);
    };
  });
}

// Web Vitals integration for web platform
export function trackWebVitals(onMetric?: (metric: any) => void) {
  if (typeof window === 'undefined') return;

  const metricHandler = onMetric || console.log;

  // Core Web Vitals - using web-vitals v4+ API
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    // Track Core Web Vitals metrics
    onCLS(metricHandler);
    onFCP(metricHandler);
    onLCP(metricHandler);
    onTTFB(metricHandler);
    // Use onINP instead of deprecated getFID
    onINP(metricHandler);
  }).catch(() => {
    // web-vitals not available, ignore
  });
}

// Enhanced Web Vitals tracking with performance monitor integration
export function trackWebVitalsWithMonitor() {
  trackWebVitals((metric) => {
    // Log to console for debugging
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
    
    // Track in performance monitor
    if (metric.name === 'LCP' || metric.name === 'FCP' || metric.name === 'TTFB') {
      // These are timing metrics
      performanceMonitor.trackRenderTime(`web-vital-${metric.name}`, metric.value);
    }
    
    // Could also send to analytics or monitoring service
    // analytics.track('web_vital', { metric: metric.name, value: metric.value });
  });
}