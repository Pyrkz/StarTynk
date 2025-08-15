import { EnvLoader } from '../env';
import type { ApiConfig, SecurityConfig } from '../types';

export function getApiConfig(): ApiConfig {
  const env = EnvLoader.get();
  
  const baseUrl = env.NEXT_PUBLIC_API_URL || env.EXPO_PUBLIC_API_URL || `${env.APP_URL}/api/${env.API_VERSION}`;
  
  return {
    version: env.API_VERSION,
    baseUrl,
    timeout: env.isProduction ? 30000 : 10000, // 30s prod, 10s dev
    retries: env.isProduction ? 3 : 1,
  };
}

export function getSecurityConfig(): SecurityConfig {
  const env = EnvLoader.get();
  
  return {
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    rateLimitMax: env.RATE_LIMIT_MAX,
    allowedOrigins: env.ALLOWED_ORIGINS,
    corsEnabled: true,
  };
}

export function getCorsConfig() {
  const securityConfig = getSecurityConfig();
  const env = EnvLoader.get();
  
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (securityConfig.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow localhost with any port
      if (env.isDevelopment && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-CSRF-Token',
      'X-Requested-With'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Per-Page',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    maxAge: 86400, // 24 hours
  };
}

export function getRateLimitConfig() {
  const securityConfig = getSecurityConfig();
  
  return {
    windowMs: securityConfig.rateLimitWindow,
    max: securityConfig.rateLimitMax,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded, try again later.',
      retryAfter: Math.ceil(securityConfig.rateLimitWindow / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/health';
    },
    keyGenerator: (req: any) => {
      return req.ip || req.connection.remoteAddress;
    },
  };
}