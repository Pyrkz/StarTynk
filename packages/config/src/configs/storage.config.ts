import { getExtendedEnv } from '../env';
import type { StorageConfig, MonitoringConfig } from '../types';

export function getStorageConfig(): StorageConfig {
  const env = getExtendedEnv();
  
  return {
    awsRegion: env.AWS_REGION,
    awsAccessKeyId: env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.S3_BUCKET,
    enabled: !!(env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET),
  };
}

export function getS3Config() {
  const storageConfig = getStorageConfig();
  
  if (!storageConfig.enabled) {
    return null;
  }
  
  return {
    region: storageConfig.awsRegion,
    credentials: {
      accessKeyId: storageConfig.awsAccessKeyId!,
      secretAccessKey: storageConfig.awsSecretAccessKey!,
    },
    bucket: storageConfig.s3Bucket,
  };
}

export function getUploadConfig() {
  const env = getExtendedEnv();
  
  return {
    // File size limits (in bytes)
    limits: {
      avatar: 5 * 1024 * 1024, // 5MB
      document: 50 * 1024 * 1024, // 50MB
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      default: 10 * 1024 * 1024, // 10MB
    },
    
    // Allowed file types
    allowedTypes: {
      avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
    },
    
    // Storage paths
    paths: {
      avatars: 'uploads/avatars',
      documents: 'uploads/documents',
      images: 'uploads/images',
      videos: 'uploads/videos',
      audio: 'uploads/audio',
      temp: 'uploads/temp',
    },
    
    // CDN configuration
    cdn: {
      enabled: env.isProduction,
      baseUrl: env.isProduction ? 'https://cdn.startynk.com' : `${env.APP_URL}/uploads`,
    },
    
    // Security
    security: {
      scanFiles: env.isProduction, // Enable virus scanning in production
      encryptFiles: env.isProduction, // Encrypt files in production
      signedUrls: true, // Use signed URLs for security
      expiration: 24 * 60 * 60, // 24 hours for signed URLs
    },
  };
}

export function getMonitoringConfig(): MonitoringConfig {
  const env = getExtendedEnv();
  
  return {
    sentryDsn: env.SENTRY_DSN,
    sentryEnvironment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    enabled: !!env.SENTRY_DSN,
  };
}

export function getSentryConfig() {
  const monitoringConfig = getMonitoringConfig();
  const env = getExtendedEnv();
  
  if (!monitoringConfig.enabled) {
    return null;
  }
  
  return {
    dsn: monitoringConfig.sentryDsn,
    environment: monitoringConfig.sentryEnvironment,
    debug: env.isDevelopment,
    tracesSampleRate: env.isProduction ? 0.1 : 1.0,
    profilesSampleRate: env.isProduction ? 0.1 : 1.0,
    beforeSend: (event: any) => {
      // Don't send events in test environment
      if (env.isTest) {
        return null;
      }
      
      // Filter out known non-critical errors
      const knownErrors = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'ChunkLoadError',
      ];
      
      if (knownErrors.some(error => event.message?.includes(error))) {
        return null;
      }
      
      return event;
    },
    integrations: [
      // Performance monitoring
      'BrowserTracing',
      // Replay sessions for debugging
      ...(env.isProduction ? ['Replay'] : []),
    ],
    // Capture replay sessions on errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}