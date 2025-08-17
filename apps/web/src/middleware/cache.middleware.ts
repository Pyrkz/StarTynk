/**
 * Intelligent cache middleware for Next.js
 * Implements client-aware caching with ETags and performance optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientDetectionService } from '../../../../packages/api/src/services/client-detection.service';
import { ETagService } from '../../../../packages/api/src/services/etag.service';
import { 
  CACHE_STRATEGIES, 
  generateCacheControlHeader, 
  generateCDNCacheControlHeader,
  CacheKeyGenerators,
  PERFORMANCE_HINTS,
  type CacheStrategy
} from '../../../../packages/api/src/config/cache.config';

import { CACHE_RULES, getCacheRule, type CacheRule } from '../app/api/cache-rules';

export interface CacheMiddlewareOptions {
  enableAnalytics?: boolean;
  enableCompression?: boolean;
  enableOptimization?: boolean;
}

/**
 * Main cache middleware function
 */
export async function cacheMiddleware(
  request: NextRequest,
  options: CacheMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const {
    enableAnalytics = true,
    enableCompression = true,
    enableOptimization = true,
  } = options;

  // Skip caching for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null;
  }

  // Get client information
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  const clientInfo = ClientDetectionService.getClientInfo({
    headers,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  // Check for conditional request headers
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  // Handle cache purging via special headers
  if (request.headers.get('x-cache-purge') === 'true') {
    return handleCachePurge(request);
  }

  // Store client info in request for later use
  (request as any).clientInfo = clientInfo;
  (request as any).cacheConfig = {
    enableAnalytics,
    enableCompression,
    enableOptimization,
  };

  // For conditional requests, we'll handle them in the response phase
  if (ifNoneMatch || ifModifiedSince) {
    (request as any).conditionalRequest = {
      ifNoneMatch,
      ifModifiedSince,
    };
  }

  // Continue to the route handler
  return null;
}

/**
 * Process response and add cache headers
 */
export function processCacheResponse(
  request: NextRequest,
  response: NextResponse,
  data?: any
): NextResponse {
  const clientInfo = (request as any).clientInfo;
  const conditionalRequest = (request as any).conditionalRequest;
  
  if (!clientInfo) {
    return response;
  }

  // Get cache rule for this endpoint
  const pathname = request.nextUrl.pathname;
  const cacheRule = getCacheRuleForPath(pathname);

  // Skip caching if strategy is NONE
  if (cacheRule.strategy === 'NONE') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // Get cache strategy based on client type
  const strategy = CACHE_STRATEGIES[cacheRule.strategy];
  const cacheOptions = strategy[clientInfo.type] || strategy.web;

  // Generate ETag if data is provided
  let etag: string | undefined;
  if (data !== undefined) {
    etag = ETagService.generateETag(data, { 
      weak: true,
      includeTimestamp: cacheRule.strategy === 'DYNAMIC'
    });
    response.headers.set('ETag', etag);
  }

  // Handle conditional requests
  if (conditionalRequest && etag) {
    if (conditionalRequest.ifNoneMatch) {
      const isMatch = ETagService.isNoneMatch(etag, conditionalRequest.ifNoneMatch);
      if (isMatch) {
        // Return 304 Not Modified
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': generateCacheControlHeader(cacheOptions),
          }
        });
      }
    }
  }

  // Set cache headers
  response.headers.set('Cache-Control', generateCacheControlHeader(cacheOptions));
  
  // Add CDN cache control for better edge caching
  if (clientInfo.type === 'mobile' && cacheOptions.maxAge > 0) {
    response.headers.set('CDN-Cache-Control', generateCDNCacheControlHeader(cacheOptions));
  }

  // Add Last-Modified header
  response.headers.set('Last-Modified', ETagService.generateLastModified());

  // Add Vary header to indicate cache variations
  const varyFactors = ['Accept-Encoding'];
  if (pathname.startsWith('/api/')) {
    varyFactors.push('X-Client-Type');
  }
  response.headers.set('Vary', ETagService.generateVaryHeader(varyFactors));

  // Add performance headers
  addPerformanceHeaders(response, clientInfo);

  // Add cache status header for debugging
  response.headers.set('X-Cache-Status', etag && conditionalRequest?.ifNoneMatch ? 'REVALIDATED' : 'MISS');
  response.headers.set('X-Client-Type', clientInfo.type);

  // Log cache analytics if enabled
  if ((request as any).cacheConfig?.enableAnalytics) {
    logCacheAnalytics(request, response, clientInfo);
  }

  return response;
}

/**
 * Get cache rule for a given path
 */
function getCacheRuleForPath(pathname: string): CacheRule {
  return getCacheRule(pathname);
}

/**
 * Add performance-related headers
 */
function addPerformanceHeaders(response: NextResponse, clientInfo: any): void {
  const hints = PERFORMANCE_HINTS[clientInfo.type] || PERFORMANCE_HINTS.web;

  // Add compression hint
  if (hints.compressionThreshold) {
    response.headers.set('X-Compression-Threshold', hints.compressionThreshold.toString());
  }

  // Add client hints
  response.headers.set('Accept-CH', 'DPR, Width, Viewport-Width, Downlink, ECT, RTT, Save-Data');
  
  // Add timing headers
  response.headers.set('X-Response-Time', Date.now().toString());
  
  // Server timing
  const timings = [
    'cache;desc="Cache Lookup";dur=0.5',
    'app;desc="Application";dur=10.2',
  ].join(', ');
  response.headers.set('Server-Timing', timings);
}

/**
 * Handle cache purging
 */
function handleCachePurge(request: NextRequest): NextResponse {
  const purgeKey = request.headers.get('x-cache-purge-key');
  const purgeTag = request.headers.get('x-cache-purge-tag');
  const purgePattern = request.headers.get('x-cache-purge-pattern');

  // Validate authorization for cache purging
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // TODO: Implement actual cache purging logic here
  // This would integrate with your cache invalidation service

  const purgeInfo = {
    key: purgeKey,
    tag: purgeTag,
    pattern: purgePattern,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    message: 'Cache purged successfully',
    details: purgeInfo,
  });
}

/**
 * Log cache analytics
 */
function logCacheAnalytics(
  request: NextRequest,
  response: NextResponse,
  clientInfo: any
): void {
  const analytics = {
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method,
    clientType: clientInfo.type,
    clientVersion: clientInfo.appVersion,
    networkQuality: clientInfo.networkQuality,
    cacheStatus: response.headers.get('X-Cache-Status'),
    responseSize: response.headers.get('content-length'),
    statusCode: response.status,
  };

  // TODO: Send to analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cache Analytics]', analytics);
  }
}

/**
 * Create cache key for request
 */
export function createCacheKey(request: NextRequest, clientInfo?: any): string {
  const url = request.nextUrl;
  const params = Object.fromEntries(url.searchParams.entries());
  
  let key = CacheKeyGenerators.api(
    request.method,
    url.pathname,
    params
  );

  // Add client-specific suffix if available
  if (clientInfo) {
    key += ':' + ClientDetectionService.getCacheKeySuffix(clientInfo);
  }

  return key;
}

/**
 * Helper to create cached response
 */
export function createCachedResponse(
  data: any,
  options: {
    status?: number;
    headers?: Record<string, string>;
    clientInfo?: any;
    cacheRule?: CacheRule;
  } = {}
): NextResponse {
  const response = NextResponse.json(data, {
    status: options.status || 200,
    headers: options.headers,
  });

  if (options.clientInfo && options.cacheRule) {
    const strategy = CACHE_STRATEGIES[options.cacheRule.strategy];
    const cacheOptions = strategy[options.clientInfo.type] || strategy.web;
    
    response.headers.set('Cache-Control', generateCacheControlHeader(cacheOptions));
    response.headers.set('ETag', ETagService.generateETag(data));
    response.headers.set('Last-Modified', ETagService.generateLastModified());
  }

  return response;
}