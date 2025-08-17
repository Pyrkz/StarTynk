import type { Environment } from '../env/env.schema';

export interface BaseConfig {
  environment: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  isTest: boolean;
}

export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  poolSize: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret?: string;
  jwtExpiry: string;
  jwtRefreshExpiry: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  bcryptRounds: number;
}

export interface SecurityConfig {
  rateLimitWindow: number;
  rateLimitMax: number;
  allowedOrigins: string[];
  corsEnabled: boolean;
}

export interface EmailConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  from?: string;
  enabled: boolean;
}

export interface StorageConfig {
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  s3Bucket?: string;
  enabled: boolean;
}

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
}

export interface CacheConfig {
  redisUrl?: string;
  defaultTtl: number;
  enabled: boolean;
}

export interface ApiConfig {
  version: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface FeatureFlags {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  maintenanceMode: boolean;
}

export interface MonitoringConfig {
  sentryDsn?: string;
  sentryEnvironment?: string;
  enabled: boolean;
}