import { NextRequest } from 'next/server';

export type ClientType = 'web' | 'mobile';

export interface ClientInfo {
  type: ClientType;
  userAgent: string;
  version?: string;
  platform?: string;
  isExpo?: boolean;
}

/**
 * Detect client type from request headers and user agent
 */
export function detectClient(request: NextRequest): ClientInfo {
  const userAgent = request.headers.get('user-agent') || '';
  const clientTypeHeader = request.headers.get('x-client-type');
  const platform = request.headers.get('x-platform');
  
  // Explicit client type header (most reliable)
  if (clientTypeHeader === 'mobile') {
    return {
      type: 'mobile',
      userAgent,
      platform: platform || 'unknown',
      isExpo: userAgent.includes('Expo'),
    };
  }
  
  if (clientTypeHeader === 'web') {
    return {
      type: 'web',
      userAgent,
      platform: 'web',
      isExpo: false,
    };
  }
  
  // Fallback to user agent detection
  if (userAgent.includes('Expo') || 
      userAgent.includes('ReactNative') ||
      platform === 'ios' ||
      platform === 'android') {
    return {
      type: 'mobile',
      userAgent,
      platform: platform || (userAgent.includes('iOS') ? 'ios' : 'android'),
      isExpo: userAgent.includes('Expo'),
    };
  }
  
  // Default to web
  return {
    type: 'web',
    userAgent,
    platform: 'web',
    isExpo: false,
  };
}

/**
 * Create platform-appropriate response
 */
export function createUnifiedResponse<T>(
  data: T,
  clientInfo: ClientInfo,
  options: {
    status?: number;
    headers?: Record<string, string>;
    message?: string;
  } = {}
) {
  const { status = 200, headers = {}, message } = options;
  
  // Base response structure
  const response = {
    success: status >= 200 && status < 300,
    data: status >= 200 && status < 300 ? data : undefined,
    error: status >= 400 ? (typeof data === 'string' ? data : message) : undefined,
    message,
    timestamp: new Date().toISOString(),
    clientType: clientInfo.type,
  };
  
  // Platform-specific optimizations
  if (clientInfo.type === 'mobile') {
    // Mobile clients prefer compressed responses
    headers['Content-Encoding'] = 'gzip';
    
    // Add mobile-specific headers
    headers['X-Mobile-Optimized'] = 'true';
    headers['Cache-Control'] = 'no-cache, private';
  } else {
    // Web clients can handle standard caching
    headers['Cache-Control'] = 'private, max-age=300';
  }
  
  // Security headers for all clients
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Error response helper
 */
export function createErrorResponse(
  error: string | Error,
  clientInfo: ClientInfo,
  status: number = 400
) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return createUnifiedResponse(
    null,
    clientInfo,
    {
      status,
      message: errorMessage,
    }
  );
}