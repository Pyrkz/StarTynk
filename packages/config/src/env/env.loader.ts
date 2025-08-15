import { envSchema, type EnvConfig } from './env.schema';
import { validateEnvironment, EnvironmentValidationError } from './env.validator';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export class EnvLoader {
  private static instance: EnvConfig | null = null;
  private static validated = false;

  static load(options?: { 
    envFile?: string; 
    strict?: boolean;
    silent?: boolean;
  }): EnvConfig {
    if (this.instance && this.validated) {
      return this.instance;
    }

    const { envFile, strict = true, silent = false } = options || {};
    
    // Load .env file
    const envPath = this.resolveEnvFile(envFile);
    if (envPath && fs.existsSync(envPath)) {
      dotenvConfig({ path: envPath });
      if (!silent) {
        console.log(`✅ Loaded environment from: ${envPath}`);
      }
    } else if (!silent) {
      console.log('ℹ️  No environment file found, using system environment variables');
    }

    // Validate environment variables
    try {
      const validated = validateEnvironment(process.env);
      this.instance = validated;
      this.validated = true;
      
      if (!silent) {
        console.log(`✅ Environment validation successful`);
        console.log(`📍 Environment: ${validated.NODE_ENV}`);
        console.log(`🏠 App URL: ${validated.APP_URL}`);
        console.log(`📊 Log Level: ${validated.LOG_LEVEL}`);
      }
      
      return validated;
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        console.error('❌ Environment validation failed:');
        error.errors.forEach(err => console.error(`  - ${err}`));
      } else {
        console.error('❌ Environment validation failed:', error);
      }
      
      if (strict) {
        process.exit(1);
      }
      throw error;
    }
  }

  private static resolveEnvFile(envFile?: string): string | null {
    if (envFile) {
      const absolutePath = path.isAbsolute(envFile) ? envFile : path.resolve(process.cwd(), envFile);
      return fs.existsSync(absolutePath) ? absolutePath : null;
    }
    
    const env = process.env.NODE_ENV || 'development';
    const possibleFiles = [
      `.env.${env}.local`,
      `.env.local`,
      `.env.${env}`,
      '.env'
    ];
    
    // Start from current working directory and go up to find env files
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      for (const file of possibleFiles) {
        const fullPath = path.join(currentDir, file);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  static get(): EnvConfig {
    if (!this.instance) {
      throw new Error('Environment not loaded. Call EnvLoader.load() first.');
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
    this.validated = false;
  }

  static isDevelopment(): boolean {
    return this.get().NODE_ENV === 'development';
  }

  static isProduction(): boolean {
    return this.get().NODE_ENV === 'production';
  }

  static isStaging(): boolean {
    return this.get().NODE_ENV === 'staging';
  }

  static isTest(): boolean {
    return this.get().NODE_ENV === 'test';
  }

  static getEnvironment(): string {
    return this.get().NODE_ENV;
  }

  static printConfiguration(includeSecrets = false): void {
    const env = this.get();
    const config: Record<string, any> = {
      environment: env.NODE_ENV,
      appUrl: env.APP_URL,
      apiVersion: env.API_VERSION,
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
      databasePoolSize: env.DATABASE_POOL_SIZE,
      rateLimitMax: env.RATE_LIMIT_MAX,
      rateLimitWindow: env.RATE_LIMIT_WINDOW,
      allowedOrigins: env.ALLOWED_ORIGINS,
      maintenanceMode: env.MAINTENANCE_MODE,
      features: {
        emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
        pushNotifications: env.ENABLE_PUSH_NOTIFICATIONS,
        smsNotifications: env.ENABLE_SMS_NOTIFICATIONS,
      }
    };

    if (includeSecrets) {
      config.secrets = {
        hasJwtSecret: !!env.JWT_SECRET,
        hasNextAuthSecret: !!env.NEXTAUTH_SECRET,
        hasDatabaseUrl: !!env.DATABASE_URL,
        hasSmtpConfig: !!(env.SMTP_HOST && env.SMTP_USER),
        hasAwsConfig: !!(env.AWS_ACCESS_KEY_ID && env.S3_BUCKET),
        hasSentry: !!env.SENTRY_DSN,
        hasRedis: !!env.REDIS_URL,
      };
    }

    console.log('📋 Current Configuration:');
    console.log(JSON.stringify(config, null, 2));
  }
}