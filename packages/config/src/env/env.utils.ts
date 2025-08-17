import { EnvLoader } from './env.loader';
import type { EnvConfig } from './env.schema';

/**
 * Environment utility functions that extend the base environment object
 * with convenience methods for environment checks
 */

export interface ExtendedEnvConfig extends EnvConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  isTest: boolean;
}

/**
 * Extends the base environment configuration with convenience boolean flags
 */
export function extendEnv(env: EnvConfig): ExtendedEnvConfig {
  return {
    ...env,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
    isTest: env.NODE_ENV === 'test',
  };
}

/**
 * Gets the extended environment configuration with boolean helpers
 */
export function getExtendedEnv(): ExtendedEnvConfig {
  const env = EnvLoader.get();
  return extendEnv(env);
}

/**
 * Environment check utilities
 */
export const envUtils = {
  isProduction: () => EnvLoader.isProduction(),
  isDevelopment: () => EnvLoader.isDevelopment(),
  isStaging: () => EnvLoader.isStaging(),
  isTest: () => EnvLoader.isTest(),
  getEnvironment: () => EnvLoader.getEnvironment(),
  get: () => getExtendedEnv(),
};

/**
 * Legacy support - provides environment object with boolean flags
 * @deprecated Use envUtils or getExtendedEnv() instead
 */
export function getEnvWithHelpers(): ExtendedEnvConfig {
  return getExtendedEnv();
}