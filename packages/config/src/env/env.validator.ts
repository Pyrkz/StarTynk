import { envSchema, type EnvConfig, validateForEnvironment } from './env.schema';
import { ZodError } from 'zod';

export class EnvironmentValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnvironment(env: Record<string, unknown>): EnvConfig {
  try {
    const validated = envSchema.parse(env);
    
    // Additional environment-specific validation
    const contextErrors = validateForEnvironment(validated);
    if (contextErrors.length > 0) {
      throw new EnvironmentValidationError(
        'Environment context validation failed',
        contextErrors
      );
    }
    
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      throw new EnvironmentValidationError(
        'Environment validation failed',
        errorMessages
      );
    }
    throw error;
  }
}

export function validateEnvironmentSafe(env: Record<string, unknown>): {
  success: boolean;
  data?: EnvConfig;
  errors?: string[];
} {
  try {
    const data = validateEnvironment(env);
    return { success: true, data };
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

export function getRequiredEnvironmentVariables(): string[] {
  return [
    'NODE_ENV',
    'APP_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
}

export function getOptionalEnvironmentVariables(): string[] {
  return [
    'DATABASE_URL_DIRECT',
    'DATABASE_POOL_SIZE',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRY',
    'JWT_REFRESH_EXPIRY',
    'BCRYPT_ROUNDS',
    'RATE_LIMIT_WINDOW',
    'RATE_LIMIT_MAX',
    'ALLOWED_ORIGINS',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'REDIS_URL',
    'CACHE_TTL',
    'SENTRY_DSN',
    'SENTRY_ENVIRONMENT',
    'LOG_LEVEL',
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_APP_NAME',
    'EXPO_PUBLIC_ENVIRONMENT',
    'EXPO_PUBLIC_APP_SCHEME',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_ENVIRONMENT',
    'ENABLE_PUSH_NOTIFICATIONS',
    'ENABLE_EMAIL_NOTIFICATIONS',
    'ENABLE_SMS_NOTIFICATIONS',
    'MAINTENANCE_MODE',
    'EXPO_PUBLIC_PUSH_TOKEN',
    'FCM_SERVER_KEY',
    'EXPO_PUBLIC_GOOGLE_ANALYTICS_ID',
    'EXPO_PUBLIC_MIXPANEL_TOKEN'
  ];
}