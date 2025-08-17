import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface MobileEnv {
  API_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  APP_SCHEME: string;
  ENVIRONMENT: string;
  IS_DEV: boolean;
  IS_PREVIEW: boolean;
  IS_PRODUCTION: boolean;
  IS_STAGING: boolean;
  // API Configuration
  API_TIMEOUT: number;
  API_RETRY_ATTEMPTS: number;
  API_RETRY_DELAY: number;
}

// Get API URL with fallback logic
function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) return envUrl;
  
  // Different URLs for different platforms in development
  if (__DEV__) {
    return Platform.select({
      ios: 'http://localhost:3000/api/v1',
      android: 'http://10.0.2.2:3000/api/v1', // Android emulator
      default: 'http://localhost:3000/api/v1',
    }) as string;
  }
  
  // Production fallback
  return 'https://api.yourdomain.com/api/v1';
}

// Access environment variables safely
export const env: MobileEnv = {
  API_URL: getApiUrl(),
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || Constants.expoConfig?.version || '1.0.0',
  APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME || 'startynk',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),
  IS_DEV: __DEV__,
  IS_PREVIEW: Constants.appOwnership === 'expo',
  IS_PRODUCTION: !__DEV__ && Constants.appOwnership === ('standalone' as any),
  IS_STAGING: process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging',
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000, // 1 second
};

// Validate required env vars
if (!env.API_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL is not set');
}

if (__DEV__) {
  console.log('📱 Mobile Environment:', {
    API_URL: env.API_URL,
    APP_NAME: env.APP_NAME,
    ENVIRONMENT: env.ENVIRONMENT,
    IS_DEV: env.IS_DEV,
    IS_PREVIEW: env.IS_PREVIEW,
    IS_PRODUCTION: env.IS_PRODUCTION,
  });
}