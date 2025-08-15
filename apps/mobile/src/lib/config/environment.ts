import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface EnvironmentConfig {
  API_URL: string;
  API_TIMEOUT: number;
  API_RETRY_ATTEMPTS: number;
  API_RETRY_DELAY: number;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  APP_VERSION: string;
  BUILD_VERSION: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    const isDev = __DEV__;
    const expoConfig = Constants.expoConfig;
    
    this.config = {
      API_URL: this.getApiUrl(),
      API_TIMEOUT: 30000, // 30 seconds
      API_RETRY_ATTEMPTS: 3,
      API_RETRY_DELAY: 1000, // 1 second
      IS_DEVELOPMENT: isDev,
      IS_PRODUCTION: !isDev,
      APP_VERSION: expoConfig?.version || '1.0.0',
      BUILD_VERSION: Constants.nativeAppVersion || '1',
    };
  }

  private getApiUrl(): string {
    // Priority: Environment variable > Expo config > Default
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (envUrl) return envUrl;
    
    // Different URLs for different environments
    if (__DEV__) {
      // For development, use local IP or ngrok URL
      return Platform.select({
        ios: 'http://localhost:3000/api/v1',
        android: 'http://10.0.2.2:3000/api/v1', // Android emulator
        default: 'http://localhost:3000/api/v1',
      }) as string;
    }
    
    // Production URL
    return 'https://api.yourdomain.com/api/v1';
  }

  get(): EnvironmentConfig {
    return this.config;
  }

  getApiUrl(): string {
    return this.config.API_URL;
  }

  isDevelopment(): boolean {
    return this.config.IS_DEVELOPMENT;
  }

  isProduction(): boolean {
    return this.config.IS_PRODUCTION;
  }
}

export const environment = new Environment();