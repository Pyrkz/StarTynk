import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  appName: string;
  appScheme: string;
  appVersion: string;
  sentryDsn?: string;
  websocketUrl?: string;
  enableLogs: boolean;
  mockApi: boolean;
  features: {
    analytics: boolean;
    crashReporting: boolean;
    pushNotifications: boolean;
  };
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    const env = this.getEnvironment();
    this.config = this.getConfig(env);
  }

  private getEnvironment(): Environment {
    // Priority: Expo Public Env > App Environment > Default
    const publicEnv = process.env.EXPO_PUBLIC_ENVIRONMENT;
    if (publicEnv) {
      return publicEnv as Environment;
    }

    // Use the modern approach for environment detection
    const appEnvironment = Constants.expoConfig?.extra?.environment;
    if (appEnvironment) {
      return appEnvironment as Environment;
    }

    // Check if running in production based on development flag
    try {
      // In React Native, __DEV__ is available as a global variable
      if ((global as any).__DEV__ === true) {
        return 'development';
      }
    } catch {
      // Fallback if __DEV__ is not available
    }

    // Default to production for release builds
    return 'production';
  }

  private getConfig(env: Environment): EnvironmentConfig {
    // Helper function to parse boolean environment variables
    const parseBool = (value: string | undefined, defaultValue: boolean): boolean => {
      if (value === undefined) return defaultValue;
      return value.toLowerCase() === 'true';
    };

    const configs: Record<Environment, EnvironmentConfig> = {
      development: {
        name: 'development',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk Dev',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk-dev',
        appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        websocketUrl: process.env.EXPO_PUBLIC_WEBSOCKET_URL,
        enableLogs: parseBool(process.env.EXPO_PUBLIC_ENABLE_LOGS, true),
        mockApi: parseBool(process.env.EXPO_PUBLIC_MOCK_API, false),
        features: {
          analytics: parseBool(process.env.EXPO_PUBLIC_ENABLE_ANALYTICS, false),
          crashReporting: parseBool(process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING, false),
          pushNotifications: parseBool(process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS, true),
        },
      },
      staging: {
        name: 'staging',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.startynk.com/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk Staging',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk-staging',
        appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        websocketUrl: process.env.EXPO_PUBLIC_WEBSOCKET_URL,
        enableLogs: parseBool(process.env.EXPO_PUBLIC_ENABLE_LOGS, true),
        mockApi: parseBool(process.env.EXPO_PUBLIC_MOCK_API, false),
        features: {
          analytics: parseBool(process.env.EXPO_PUBLIC_ENABLE_ANALYTICS, true),
          crashReporting: parseBool(process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING, true),
          pushNotifications: parseBool(process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS, true),
        },
      },
      production: {
        name: 'production',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.startynk.com/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk',
        appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        websocketUrl: process.env.EXPO_PUBLIC_WEBSOCKET_URL,
        enableLogs: parseBool(process.env.EXPO_PUBLIC_ENABLE_LOGS, false),
        mockApi: parseBool(process.env.EXPO_PUBLIC_MOCK_API, false),
        features: {
          analytics: parseBool(process.env.EXPO_PUBLIC_ENABLE_ANALYTICS, true),
          crashReporting: parseBool(process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING, true),
          pushNotifications: parseBool(process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS, true),
        },
      },
    };

    return configs[env];
  }

  get current(): EnvironmentConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.name === 'development';
  }

  isStaging(): boolean {
    return this.config.name === 'staging';
  }

  isProduction(): boolean {
    return this.config.name === 'production';
  }

  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  log(...args: any[]): void {
    if (this.config.enableLogs) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    if (this.config.enableLogs) {
      console.error(...args);
    }
  }
}

export const env = new EnvironmentManager();