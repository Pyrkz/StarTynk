import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  appName: string;
  appScheme: string;
  sentryDsn?: string;
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
    // Priority: Expo Public Env > Release Channel > Default
    const publicEnv = process.env.EXPO_PUBLIC_ENVIRONMENT;
    if (publicEnv) {
      return publicEnv as Environment;
    }

    const releaseChannel = Constants.expoConfig?.releaseChannel;
    switch (releaseChannel) {
      case 'production':
        return 'production';
      case 'staging':
        return 'staging';
      default:
        return 'development';
    }
  }

  private getConfig(env: Environment): EnvironmentConfig {
    const configs: Record<Environment, EnvironmentConfig> = {
      development: {
        name: 'development',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk Dev',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk-dev',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableLogs: true,
        mockApi: false,
        features: {
          analytics: false,
          crashReporting: false,
          pushNotifications: true,
        },
      },
      staging: {
        name: 'staging',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.startynk.com/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk Staging',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk-staging',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableLogs: true,
        mockApi: false,
        features: {
          analytics: true,
          crashReporting: true,
          pushNotifications: true,
        },
      },
      production: {
        name: 'production',
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.startynk.com/api/v1',
        appName: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk',
        appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk',
        sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableLogs: false,
        mockApi: false,
        features: {
          analytics: true,
          crashReporting: true,
          pushNotifications: true,
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