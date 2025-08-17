# Intelligent Caching System for Mobile Clients

This directory contains the intelligent caching middleware implementation designed to optimize API performance for mobile clients in the StarTynk application.

## Overview

The caching system automatically detects mobile clients and applies aggressive caching strategies to:
- Reduce bandwidth usage for field workers with poor network conditions
- Improve response times through ETags and conditional requests
- Optimize payload sizes for mobile consumption
- Provide cache analytics for monitoring performance

## Key Components

### 1. Client Detection Service
- **Location**: `services/client-detection.service.ts`
- **Purpose**: Accurately identifies mobile vs web clients
- **Detection Methods**:
  - Explicit `X-Client-Type` header
  - App version headers
  - User-Agent parsing
  - Network quality detection (Save-Data, ECT headers)

### 2. Cache Configuration
- **Location**: `config/cache.config.ts`
- **Strategies**:
  - `STATIC`: Long-lived data (projects metadata, users)
  - `DYNAMIC`: Frequently changing data (tasks, real-time updates)
  - `PRIVATE`: User-specific data
  - `COLLECTION`: Lists and filtered results
  - `NONE`: Never cache (auth endpoints)

### 3. ETag Service
- **Location**: `services/etag.service.ts`
- **Features**:
  - Generates weak ETags for content validation
  - Supports collection ETags
  - Handles conditional requests (If-None-Match)
  - Validates 304 Not Modified responses

### 4. Cache Middleware
- **Location**: `apps/web/src/middleware/cache.middleware.ts`
- **Responsibilities**:
  - Applies cache headers based on endpoint rules
  - Processes conditional requests
  - Handles cache purging
  - Integrates with analytics

### 5. Response Optimizer
- **Location**: `utils/response-optimizer.ts`
- **Optimizations**:
  - Field filtering (`?fields=id,name`)
  - Null value removal
  - Date to timestamp conversion
  - String truncation for large text
  - Pagination header management

### 6. Cache Analytics
- **Location**: `services/cache-analytics.service.ts`
- **Metrics**:
  - Hit/miss ratios
  - Bandwidth saved
  - Response times
  - Client type distribution
  - Popular cache keys

## Usage Examples

### Basic API Route with Caching

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { processCacheResponse } from '@/middleware/cache.middleware';

export async function GET(request: NextRequest) {
  // Your data fetching logic
  const data = await fetchData();
  
  // Create response
  const response = NextResponse.json(data);
  
  // Apply caching (automatically handles client detection, ETags, etc.)
  return processCacheResponse(request, response, data);
}
```

### Mobile Client Request Example

```bash
# Mobile client request with caching
curl -H "X-Client-Type: mobile" \
     -H "X-App-Version: 1.2.3" \
     http://localhost:3000/api/projects

# Response includes cache headers:
# Cache-Control: public, max-age=86400, stale-while-revalidate=604800
# ETag: W/"abc123"
# X-Client-Type: mobile
```

### Conditional Request (304 Response)

```bash
# Second request with ETag
curl -H "X-Client-Type: mobile" \
     -H "If-None-Match: W/\"abc123\"" \
     http://localhost:3000/api/projects

# Returns 304 Not Modified if content unchanged
```

## Cache Strategies by Endpoint

| Endpoint Pattern | Strategy | Mobile TTL | Web TTL | Notes |
|-----------------|----------|------------|---------|-------|
| `/api/auth/*` | NONE | - | - | Never cached |
| `/api/projects` | COLLECTION | 10 min | 3 min | List endpoints |
| `/api/projects/[id]` | STATIC | 2 hours | 1 hour | Individual resources |
| `/api/users/me` | PRIVATE | 30 min | No cache | User-specific |
| `/api/*/statistics` | STATIC | 1 hour | 1 hour | Computed data |
| `/api/sync/*` | NONE | - | - | Real-time sync |

## Performance Optimization

### Mobile-Specific Optimizations

1. **Aggressive Caching**: Mobile clients receive longer cache TTLs
2. **Response Compression**: Automatic for responses > 1KB
3. **Field Filtering**: Use `?fields=id,name,status` to reduce payload
4. **Date Conversion**: Dates converted to timestamps (smaller)
5. **Null Removal**: Null values stripped from responses

### Network-Aware Caching

The system adapts based on network conditions:
- **Save-Data On**: Extended cache times, maximum compression
- **Slow Network (2G/3G)**: Longer stale-while-revalidate periods
- **Offline Mode**: Leverages service worker cache

## Cache Invalidation

### Automatic Invalidation

```typescript
// After creating/updating/deleting a project
await CacheInvalidationService.invalidateAfterMutation(
  'project',
  'update',
  projectId,
  { broadcast: true }
);
```

### Manual Cache Purging

```bash
# Purge by tag
curl -X POST -H "X-Cache-Purge: true" \
     -H "X-Cache-Purge-Tag: project:123" \
     -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/cache/purge

# Purge by pattern
curl -X POST -H "X-Cache-Purge: true" \
     -H "X-Cache-Purge-Pattern: /api/projects/*" \
     -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/cache/purge
```

## Analytics and Monitoring

### View Cache Statistics

```typescript
// Get overall stats
const stats = CacheAnalyticsService.getStats('day');
console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Bandwidth Saved: ${stats.bandwidthSaved} bytes`);

// Get stats by endpoint
const endpointStats = CacheAnalyticsService.getStatsByEndpoint('hour');

// Get real-time metrics
const realTime = CacheAnalyticsService.getRealTimeMetrics();
console.log(`Current QPS: ${realTime.currentQPS}`);
```

### Export Analytics

```typescript
// Export as JSON
const analyticsJson = CacheAnalyticsService.exportAnalytics('json');

// Export as CSV
const analyticsCsv = CacheAnalyticsService.exportAnalytics('csv');
```

## Testing

### Test Mobile Client Caching

```bash
# 1. First request (cache miss)
curl -H "X-Client-Type: mobile" http://localhost:3000/api/projects
# Note the ETag in response headers

# 2. Second request (cache hit)
curl -H "X-Client-Type: mobile" \
     -H "If-None-Match: <etag-from-first-request>" \
     http://localhost:3000/api/projects
# Should return 304 Not Modified

# 3. Test field filtering
curl -H "X-Client-Type: mobile" \
     "http://localhost:3000/api/projects?fields=id,name,status"
# Response should only include requested fields
```

### Test Cache Invalidation

```bash
# 1. Create a project (invalidates cache)
curl -X POST -H "Content-Type: application/json" \
     -d '{"name":"Test Project"}' \
     http://localhost:3000/api/projects

# 2. Verify cache was invalidated
curl -H "X-Client-Type: mobile" \
     -H "If-None-Match: <previous-etag>" \
     http://localhost:3000/api/projects
# Should return 200 with new data, not 304
```

## Configuration

### Environment Variables

```env
# Cache TTL in seconds (default: 300)
CACHE_TTL=300

# Enable cache analytics
ENABLE_CACHE_ANALYTICS=true

# CDN Configuration (optional)
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token
```

### Customizing Cache Rules

Edit `apps/web/src/app/api/cache-rules.ts` to modify caching behavior:

```typescript
export const CACHE_RULES: Record<string, CacheRule> = {
  '/api/custom-endpoint': {
    strategy: 'STATIC',
    revalidate: 7200, // 2 hours
    tags: (params) => [`custom:${params.id}`],
  },
};
```

## Best Practices

1. **Never Cache Sensitive Data**: Auth endpoints, payment info, etc.
2. **Use Appropriate Strategies**: Static for reference data, dynamic for real-time
3. **Implement Cache Invalidation**: Update caches when data changes
4. **Monitor Performance**: Use analytics to optimize cache rules
5. **Test Thoroughly**: Verify caching behavior across different clients

## Troubleshooting

### Cache Not Working

1. Check client detection:
   ```typescript
   console.log(ClientDetectionService.getClientInfo({ headers }));
   ```

2. Verify cache rules match your endpoint:
   ```typescript
   console.log(getCacheRule('/api/your-endpoint'));
   ```

3. Check response headers:
   - Look for `Cache-Control`, `ETag`, `X-Cache-Status`

### 304 Responses Not Working

1. Ensure ETags are being generated
2. Verify `If-None-Match` header is sent
3. Check that response data is consistent

### Performance Issues

1. Review cache analytics for low hit rates
2. Adjust cache strategies based on usage patterns
3. Enable response optimization for large payloads

## Future Enhancements

- [ ] Redis integration for distributed caching
- [ ] GraphQL query caching
- [ ] Predictive prefetching for mobile
- [ ] Offline queue synchronization
- [ ] WebSocket cache notifications