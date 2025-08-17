import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/startup';
import { ApiResponse, createSuccessResponse } from '@repo/api/web';

export async function GET(request: NextRequest) {
  try {
    const health = await healthCheck();
    
    const status = health.status === 'healthy' ? 200 : 503;
    
    if (health.status === 'healthy') {
      return createSuccessResponse({
        ...health,
        uptime: process.uptime()
      });
    } else {
      return new Response(
        JSON.stringify(ApiResponse.error('Service unhealthy', 'UNHEALTHY', health)),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify(ApiResponse.error('Health check failed', 'HEALTH_CHECK_ERROR')),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const health = await healthCheck();
    const status = health.status === 'healthy' ? 200 : 503;
    return new NextResponse(null, { status });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}