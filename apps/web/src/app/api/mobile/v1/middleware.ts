import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@repo/utils/logger';

const logger = new Logger('MobileAPI');

export async function middleware(request: NextRequest) {
  // Add mobile-specific headers
  const response = NextResponse.next();
  
  // Enable compression for mobile responses
  response.headers.set('Content-Encoding', 'gzip');
  response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes cache
  
  // Add API version header
  response.headers.set('X-API-Version', 'mobile-v1');
  
  // Log mobile API requests
  logger.debug('Mobile API request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  });
  
  return response;
}

export const config = {
  matcher: '/api/mobile/v1/:path*',
};