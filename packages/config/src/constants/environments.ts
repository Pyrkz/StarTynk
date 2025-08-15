export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export type EnvironmentType = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];

export const ENVIRONMENT_CONFIGS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    logLevel: 'debug',
    enableDebugTools: true,
    enableHotReload: true,
    minifyCode: false,
    enableSourceMaps: true,
    enableAnalytics: false,
  },
  [ENVIRONMENTS.STAGING]: {
    logLevel: 'info',
    enableDebugTools: false,
    enableHotReload: false,
    minifyCode: true,
    enableSourceMaps: true,
    enableAnalytics: true,
  },
  [ENVIRONMENTS.PRODUCTION]: {
    logLevel: 'warn',
    enableDebugTools: false,
    enableHotReload: false,
    minifyCode: true,
    enableSourceMaps: false,
    enableAnalytics: true,
  },
  [ENVIRONMENTS.TEST]: {
    logLevel: 'error',
    enableDebugTools: false,
    enableHotReload: false,
    minifyCode: false,
    enableSourceMaps: false,
    enableAnalytics: false,
  },
} as const;