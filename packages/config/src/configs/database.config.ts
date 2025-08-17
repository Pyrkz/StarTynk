import { getExtendedEnv } from '../env';
import type { DatabaseConfig } from '../types';

export function getDatabaseConfig(): DatabaseConfig {
  const env = getExtendedEnv();
  
  return {
    url: env.DATABASE_URL,
    directUrl: env.DATABASE_URL_DIRECT,
    poolSize: env.DATABASE_POOL_SIZE,
    connectionTimeout: env.isProduction ? 10000 : 5000, // 10s prod, 5s dev
    idleTimeout: env.isProduction ? 60000 : 30000, // 60s prod, 30s dev
    maxLifetime: env.isProduction ? 3600000 : 1800000, // 60min prod, 30min dev
  };
}

export function getPrismaConfig() {
  const dbConfig = getDatabaseConfig();
  const env = getExtendedEnv();
  
  return {
    datasource: {
      url: dbConfig.url,
      directUrl: dbConfig.directUrl,
    },
    log: env.isDevelopment 
      ? ['query', 'info', 'warn', 'error'] 
      : ['warn', 'error'],
    errorFormat: env.isDevelopment ? 'pretty' : 'minimal',
  };
}