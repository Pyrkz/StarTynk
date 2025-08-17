import { NextRequest } from 'next/server';

/**
 * Mobile-specific login endpoint (redirect to unified)
 * This exists for backward compatibility and mobile-specific optimizations
 */
export async function POST(request: NextRequest) {
  // Add mobile-specific headers
  const headers = new Headers(request.headers);
  headers.set('x-client-type', 'mobile');
  
  // Forward to unified endpoint with mobile context
  const unifiedRequest = new NextRequest(
    request.url.replace('/mobile/v1/auth/login', '/v1/auth/unified-login'),
    {
      method: 'POST',
      headers,
      body: request.body,
    }
  );
  
  // Import the unified handler dynamically to avoid circular dependencies
  const { POST: unifiedPost } = await import('../../../../v1/auth/unified-login/route');
  return unifiedPost(unifiedRequest);
}