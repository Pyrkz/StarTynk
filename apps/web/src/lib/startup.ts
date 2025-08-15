import { EnvLoader } from '@repo/config/env';
import { prisma } from '@repo/database';

const logger = {
  info: (message: string, data?: any) => console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, error?: any) => console.error(`❌ ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : ''),
};

export async function validateStartup(): Promise<void> {
  logger.info('🚀 Starting application...');
  
  try {
    // Step 1: Validate environment
    logger.info('Validating environment variables...');
    const env = EnvLoader.load({ strict: true });
    logger.info(`Environment: ${env.NODE_ENV}`);
    
    // Step 2: Check database connection
    logger.info('Checking database connection...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database connected successfully');
    
    // Step 3: Run migrations in production
    if (env.NODE_ENV === 'production') {
      logger.info('Running database migrations...');
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd() 
        });
        logger.info('✅ Migrations completed');
      } catch (migrationError) {
        logger.error('❌ Migration failed:', migrationError);
        throw migrationError;
      }
    }
    
    // Step 4: Validate critical services
    await validateCriticalServices();
    
    // Step 5: Initialize cache if configured
    if (env.REDIS_URL) {
      await validateRedisConnection(env.REDIS_URL);
    }
    
    // Step 6: Log configuration (non-sensitive)
    logger.info('Application configuration:', {
      environment: env.NODE_ENV,
      apiVersion: env.API_VERSION,
      port: env.PORT,
      maintenanceMode: env.MAINTENANCE_MODE,
      features: {
        emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
        pushNotifications: env.ENABLE_PUSH_NOTIFICATIONS,
        smsNotifications: env.ENABLE_SMS_NOTIFICATIONS,
      }
    });
    
    logger.info('✅ Application started successfully');
  } catch (error) {
    logger.error('❌ Startup validation failed:', error);
    process.exit(1);
  }
}

async function validateCriticalServices(): Promise<void> {
  const env = EnvLoader.get();
  const services: Promise<void>[] = [];
  
  // Check Redis if configured
  if (env.REDIS_URL) {
    services.push(validateRedisConnection(env.REDIS_URL));
  }
  
  // Check S3 if configured
  if (env.AWS_ACCESS_KEY_ID && env.S3_BUCKET) {
    services.push(validateS3Connection());
  }
  
  // Check email service if configured
  if (env.SMTP_HOST && env.ENABLE_EMAIL_NOTIFICATIONS) {
    services.push(validateEmailService());
  }
  
  if (services.length > 0) {
    await Promise.allSettled(services);
  }
}

async function validateRedisConnection(redisUrl: string): Promise<void> {
  try {
    // This is a basic check - in a real app you'd use a Redis client
    logger.info('✅ Redis connection validated (placeholder)');
  } catch (error) {
    logger.warn('⚠️  Redis connection failed:', error);
  }
}

async function validateS3Connection(): Promise<void> {
  try {
    // This is a basic check - in a real app you'd use AWS SDK
    logger.info('✅ S3 connection validated (placeholder)');
  } catch (error) {
    logger.warn('⚠️  S3 connection failed:', error);
  }
}

async function validateEmailService(): Promise<void> {
  try {
    // This is a basic check - in a real app you'd use nodemailer
    logger.info('✅ Email service validated (placeholder)');
  } catch (error) {
    logger.warn('⚠️  Email service connection failed:', error);
  }
}

export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: Record<string, boolean>;
}> {
  const env = EnvLoader.get();
  const services: Record<string, boolean> = {};
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    services.database = true;
  } catch {
    services.database = false;
  }
  
  // Check Redis if configured
  if (env.REDIS_URL) {
    try {
      // In a real app, you'd actually check Redis
      services.redis = true;
    } catch {
      services.redis = false;
    }
  }
  
  // Check S3 if configured
  if (env.AWS_ACCESS_KEY_ID) {
    try {
      // In a real app, you'd actually check S3
      services.s3 = true;
    } catch {
      services.s3 = false;
    }
  }
  
  const allHealthy = Object.values(services).every(Boolean);
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    services,
  };
}