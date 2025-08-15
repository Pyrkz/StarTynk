import { EnvLoader } from '../env';
import type { BaseConfig } from '../types';

export interface AppConfig extends BaseConfig {
  name: string;
  version: string;
  url: string;
  port: number;
  apiVersion: string;
  maintenanceMode: boolean;
  cors: {
    enabled: boolean;
    origins: string[];
  };
}

export function getAppConfig(): AppConfig {
  const env = EnvLoader.get();
  
  return {
    name: env.NEXT_PUBLIC_APP_NAME || env.EXPO_PUBLIC_APP_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    url: env.APP_URL,
    port: env.PORT,
    apiVersion: env.API_VERSION,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
    isTest: env.NODE_ENV === 'test',
    maintenanceMode: env.MAINTENANCE_MODE,
    cors: {
      enabled: true,
      origins: env.ALLOWED_ORIGINS,
    },
  };
}