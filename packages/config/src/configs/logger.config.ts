import { getExtendedEnv } from '../env';
import type { LoggerConfig } from '../types';
import * as path from 'path';

export function getLoggerConfig(): LoggerConfig {
  const env = getExtendedEnv();
  
  return {
    level: env.LOG_LEVEL,
    enableConsole: true,
    enableFile: env.isProduction,
    filePath: env.isProduction ? path.join(process.cwd(), 'logs', 'app.log') : undefined,
  };
}

export function getWinstonConfig() {
  const loggerConfig = getLoggerConfig();
  const env = getExtendedEnv();
  
  const transports: any[] = [];
  
  // Console transport
  if (loggerConfig.enableConsole) {
    transports.push({
      type: 'console',
      level: loggerConfig.level,
      format: env.isDevelopment ? 'dev' : 'json',
      colorize: env.isDevelopment,
      timestamp: true,
    });
  }
  
  // File transport for production
  if (loggerConfig.enableFile && loggerConfig.filePath) {
    transports.push({
      type: 'file',
      filename: loggerConfig.filePath,
      level: loggerConfig.level,
      format: 'json',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      timestamp: true,
    });
    
    // Error file
    transports.push({
      type: 'file',
      filename: loggerConfig.filePath.replace('.log', '.error.log'),
      level: 'error',
      format: 'json',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      timestamp: true,
    });
  }
  
  return {
    level: loggerConfig.level,
    transports,
    defaultMeta: {
      service: 'startynk-api',
      environment: env.NODE_ENV,
    },
    format: {
      errors: { stack: true },
      timestamp: true,
      json: true,
    },
    exitOnError: false,
  };
}

export function getLogLevels() {
  return {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  };
}