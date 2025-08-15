import { z } from 'zod';

// Define environment enum
export const Environment = z.enum(['development', 'staging', 'production', 'test']);
export type Environment = z.infer<typeof Environment>;

// Complete environment schema
export const envSchema = z.object({
  // Node environment
  NODE_ENV: Environment,
  
  // Application
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  APP_URL: z.string().url(),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_DIRECT: z.string().optional(), // For connection pooling
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(10),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',')),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Storage (optional)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  
  // Cache (optional)
  REDIS_URL: z.string().optional(),
  CACHE_TTL: z.coerce.number().default(3600), // 1 hour
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Mobile app specific
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_APP_NAME: z.string().default('StarTynk'),
  EXPO_PUBLIC_ENVIRONMENT: Environment.optional(),
  EXPO_PUBLIC_APP_SCHEME: z.string().default('startynk'),
  
  // Web app specific
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('StarTynk'),
  NEXT_PUBLIC_ENVIRONMENT: Environment.optional(),
  
  // Feature flags (optional)
  ENABLE_PUSH_NOTIFICATIONS: z.coerce.boolean().default(false),
  ENABLE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(true),
  ENABLE_SMS_NOTIFICATIONS: z.coerce.boolean().default(false),
  MAINTENANCE_MODE: z.coerce.boolean().default(false),
  
  // Push notifications (optional)
  EXPO_PUBLIC_PUSH_TOKEN: z.string().optional(),
  FCM_SERVER_KEY: z.string().optional(),
  
  // Analytics (optional)
  EXPO_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  EXPO_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validation helper for specific environment requirements
export const validateForEnvironment = (env: EnvConfig) => {
  const errors: string[] = [];
  
  // Production-specific validations
  if (env.NODE_ENV === 'production') {
    if (!env.SENTRY_DSN) {
      errors.push('SENTRY_DSN is required in production');
    }
    if (env.LOG_LEVEL === 'debug') {
      errors.push('LOG_LEVEL should not be debug in production');
    }
    if (env.JWT_SECRET.length < 64) {
      errors.push('JWT_SECRET should be at least 64 characters in production');
    }
  }
  
  // Email configuration validation
  const hasEmailConfig = !!(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD);
  if (env.ENABLE_EMAIL_NOTIFICATIONS && !hasEmailConfig) {
    errors.push('Email notifications enabled but SMTP configuration is incomplete');
  }
  
  // Storage configuration validation
  const hasStorageConfig = !!(env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET);
  if (!hasStorageConfig && env.NODE_ENV === 'production') {
    console.warn('⚠️  Storage configuration missing - file uploads will be disabled');
  }
  
  return errors;
};