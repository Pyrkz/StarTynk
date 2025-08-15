interface LogEntry {
  type: 'API_REQUEST' | 'API_RESPONSE' | 'API_ERROR';
  requestId: string;
  timestamp: string;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  error?: string;
  userAgent?: string;
  ip?: string;
}

export async function loggingMiddleware(
  request: Request, 
  handler: (request: Request) => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Extract request metadata
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';

  // Log incoming request
  const requestLog: LogEntry = {
    type: 'API_REQUEST',
    requestId,
    timestamp,
    method,
    url,
    userAgent,
    ip
  };
  
  console.log(JSON.stringify(requestLog));

  try {
    // Execute the handler
    const response = await handler(request);
    const duration = Date.now() - start;
    
    // Log successful response
    const responseLog: LogEntry = {
      type: 'API_RESPONSE',
      requestId,
      timestamp: new Date().toISOString(),
      status: response.status,
      duration
    };
    
    console.log(JSON.stringify(responseLog));
    
    // Add request ID to response headers
    const headers = new Headers(response.headers);
    headers.set('X-Request-ID', requestId);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log error
    const errorLog: LogEntry = {
      type: 'API_ERROR',
      requestId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      duration
    };
    
    console.error(JSON.stringify(errorLog));
    
    // Re-throw the error to be handled by error middleware
    throw error;
  }
}

export function createStructuredLogger(service: string = 'api') {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      console.log(JSON.stringify({
        level: 'info',
        service,
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    },
    
    warn: (message: string, meta?: Record<string, any>) => {
      console.warn(JSON.stringify({
        level: 'warn',
        service,
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    },
    
    error: (message: string, error?: Error, meta?: Record<string, any>) => {
      console.error(JSON.stringify({
        level: 'error',
        service,
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    },
    
    debug: (message: string, meta?: Record<string, any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify({
          level: 'debug',
          service,
          message,
          timestamp: new Date().toISOString(),
          ...meta
        }));
      }
    }
  };
}

export const logger = createStructuredLogger();