interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultCorsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export function corsMiddleware(options: CorsOptions = {}) {
  const config = { ...defaultCorsOptions, ...options };

  return function cors(request: Request): Response | null {
    const origin = request.headers.get('origin');
    const method = request.method.toUpperCase();

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const headers = new Headers();

      // Set origin
      if (config.origin === true) {
        headers.set('Access-Control-Allow-Origin', origin || '*');
      } else if (typeof config.origin === 'string') {
        headers.set('Access-Control-Allow-Origin', config.origin);
      } else if (Array.isArray(config.origin)) {
        if (origin && config.origin.includes(origin)) {
          headers.set('Access-Control-Allow-Origin', origin);
        }
      }

      // Set methods
      if (config.methods) {
        headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
      }

      // Set headers
      if (config.allowedHeaders) {
        headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      }

      // Set credentials
      if (config.credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }

      // Set max age
      if (config.maxAge) {
        headers.set('Access-Control-Max-Age', config.maxAge.toString());
      }

      return new Response(null, { status: 204, headers });
    }

    // For actual requests, we'll add headers to the response
    return null;
  };
}

export function addCorsHeaders(response: Response, options: CorsOptions = {}): Response {
  const config = { ...defaultCorsOptions, ...options };
  const headers = new Headers(response.headers);

  // Set origin (this would need the original request to determine origin)
  if (config.origin === true) {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (typeof config.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', config.origin);
  }

  // Set credentials
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const defaultCors = corsMiddleware();