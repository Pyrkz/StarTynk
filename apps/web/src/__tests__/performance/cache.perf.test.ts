/**
 * Performance tests for caching system
 */
import { QueryClient } from '@tanstack/react-query';
import { performanceMonitor, setupPerformanceMonitoring } from '@repo/features/lib/performance';
import { SmartCacheInvalidator } from '@repo/features/lib/cache-strategies';

describe('Cache Performance Tests', () => {
  let queryClient: QueryClient;
  let cacheInvalidator: SmartCacheInvalidator;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    cacheInvalidator = new SmartCacheInvalidator(queryClient);
    setupPerformanceMonitoring(queryClient);
    performanceMonitor.reset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Cache Hit Rate', () => {
    it('should achieve >80% cache hit rate for repeated queries', async () => {
      // Simulate API calls
      const mockData = { id: 1, name: 'Test User' };
      
      // First call - cache miss
      queryClient.setQueryData(['users', '1'], mockData);
      performanceMonitor.trackApiCall(100, 'users:1', false);
      
      // Subsequent calls - cache hits
      for (let i = 0; i < 10; i++) {
        queryClient.getQueryData(['users', '1']);
        performanceMonitor.trackApiCall(5, 'users:1', true);
      }
      
      const metrics = performanceMonitor.getMetrics();
      const cacheHitRate = performanceMonitor.getCacheHitRate();
      
      expect(cacheHitRate).toBeGreaterThan(80);
      expect(metrics.cacheHits).toBe(10);
      expect(metrics.cacheMisses).toBe(1);
    });
  });

  describe('Response Time Performance', () => {
    it('should maintain average response time under 200ms', () => {
      // Simulate various response times
      const responseTimes = [50, 100, 150, 200, 75, 125, 90, 180, 60, 110];
      
      responseTimes.forEach((time, index) => {
        performanceMonitor.trackApiCall(time, `query:${index}`, false);
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageResponseTime).toBeLessThan(200);
    });

    it('should identify slow queries correctly', () => {
      // Add some slow queries
      performanceMonitor.trackApiCall(3000, 'slow-query-1', false);
      performanceMonitor.trackApiCall(2500, 'slow-query-2', false);
      performanceMonitor.trackApiCall(100, 'fast-query', false);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.slowQueries).toHaveLength(2);
      expect(metrics.slowQueries).toContain('slow-query-1 (3000ms)');
      expect(metrics.slowQueries).toContain('slow-query-2 (2500ms)');
    });
  });

  describe('Cache Invalidation Performance', () => {
    it('should invalidate related queries efficiently', async () => {
      const startTime = performance.now();
      
      // Set up multiple related queries
      queryClient.setQueryData(['users'], [{ id: 1, name: 'User 1' }]);
      queryClient.setQueryData(['users', 'list'], [{ id: 1, name: 'User 1' }]);
      queryClient.setQueryData(['users', 'count'], 1);
      queryClient.setQueryData(['users', '1'], { id: 1, name: 'User 1' });
      
      // Invalidate related queries
      cacheInvalidator.invalidateRelated('update', 'users', '1');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Invalidation should be very fast (under 10ms)
      expect(duration).toBeLessThan(10);
    });

    it('should handle bulk cache cleanup efficiently', async () => {
      // Create many cache entries
      for (let i = 0; i < 100; i++) {
        queryClient.setQueryData(['test', i.toString()], { id: i, data: 'test' });
      }
      
      const startTime = performance.now();
      const removedCount = cacheInvalidator.cleanupCache(0); // Remove all
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(removedCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Cleanup should be fast
    });
  });

  describe('Memory Usage', () => {
    it('should maintain reasonable memory usage', () => {
      // Add data to cache
      for (let i = 0; i < 50; i++) {
        const largeData = {
          id: i,
          data: 'x'.repeat(1000), // 1KB of data
        };
        queryClient.setQueryData(['large', i.toString()], largeData);
      }
      
      const stats = cacheInvalidator.getCacheStats();
      
      // Should have reasonable memory usage (under 10MB for test data)
      expect(stats.memoryUsage).toBeLessThan(10);
      expect(stats.totalQueries).toBe(50);
    });

    it('should export and import cache efficiently', async () => {
      // Add test data
      queryClient.setQueryData(['users'], [{ id: 1, name: 'User 1' }]);
      queryClient.setQueryData(['projects'], [{ id: 1, title: 'Project 1' }]);
      
      const startTime = performance.now();
      
      // Export cache
      const exportedCache = cacheInvalidator.exportCache();
      
      // Clear cache
      queryClient.clear();
      
      // Import cache
      cacheInvalidator.importCache(exportedCache);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Export/import should be fast
      expect(duration).toBeLessThan(100);
      
      // Data should be restored
      expect(queryClient.getQueryData(['users'])).toBeDefined();
      expect(queryClient.getQueryData(['projects'])).toBeDefined();
    });
  });

  describe('Error Rate Tracking', () => {
    it('should track error rates accurately', () => {
      // Simulate successful calls
      for (let i = 0; i < 8; i++) {
        performanceMonitor.trackApiCall(100, `success:${i}`, false);
      }
      
      // Simulate failed calls
      for (let i = 0; i < 2; i++) {
        performanceMonitor.trackApiCall(100, `error:${i}`, false, true);
      }
      
      const metrics = performanceMonitor.getMetrics();
      
      // Should have 20% error rate
      expect(metrics.errorRate).toBe(20);
      expect(metrics.apiCalls).toBe(10);
    });
  });

  describe('Query Statistics', () => {
    it('should provide detailed query statistics', () => {
      const queryKey = 'users:list';
      
      // Track multiple calls with varying performance
      performanceMonitor.trackApiCall(100, queryKey, false);
      performanceMonitor.trackApiCall(150, queryKey, true);
      performanceMonitor.trackApiCall(75, queryKey, false, true); // error
      performanceMonitor.trackApiCall(200, queryKey, true);
      
      const stats = performanceMonitor.getQueryStats(queryKey);
      
      expect(stats).toBeDefined();
      expect(stats?.totalCalls).toBe(4);
      expect(stats?.averageDuration).toBe(131.25); // (100+150+75+200)/4
      expect(stats?.minDuration).toBe(75);
      expect(stats?.maxDuration).toBe(200);
      expect(stats?.errorRate).toBe(25); // 1 error out of 4 calls
      expect(stats?.cacheHitRate).toBe(50); // 2 cache hits out of 4 calls
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should meet performance targets', () => {
    const startTime = performance.now();
    
    // Simulate realistic workload
    const queryClient = new QueryClient();
    const monitor = performanceMonitor;
    
    // 100 API calls with realistic distribution
    for (let i = 0; i < 70; i++) {
      // 70% fast calls
      monitor.trackApiCall(Math.random() * 200, `fast:${i}`, Math.random() > 0.5);
    }
    
    for (let i = 0; i < 25; i++) {
      // 25% medium calls
      monitor.trackApiCall(200 + Math.random() * 300, `medium:${i}`, Math.random() > 0.7);
    }
    
    for (let i = 0; i < 5; i++) {
      // 5% slow calls
      monitor.trackApiCall(500 + Math.random() * 1000, `slow:${i}`, false);
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    const metrics = monitor.getMetrics();
    
    // Performance targets
    expect(processingTime).toBeLessThan(100); // Processing should be fast
    expect(metrics.averageResponseTime).toBeLessThan(400); // Average under 400ms
    expect(monitor.getCacheHitRate()).toBeGreaterThan(40); // At least 40% cache hits
    expect(metrics.slowQueries.length).toBeLessThan(10); // Limited slow queries
  });
});