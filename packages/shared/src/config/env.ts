import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  
  // API
  API_URL: z.string().url(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Optional services
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

// Validate environment variables
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

// Export typed env object (for server-side only)
export const env = process.env.NODE_ENV === 'test' 
  ? {} as z.infer<typeof envSchema>
  : validateEnv();

// Export type for client configs
export type ClientEnv = {
  API_URL: string;
  APP_NAME?: string;
  APP_VERSION?: string;
};