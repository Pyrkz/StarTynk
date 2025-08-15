import Constants from 'expo-constants';

interface MobileEnv {
  API_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  IS_DEV: boolean;
  IS_PREVIEW: boolean;
  IS_PRODUCTION: boolean;
}

// Access environment variables safely
export const env: MobileEnv = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'StarTynk',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  IS_DEV: __DEV__,
  IS_PREVIEW: Constants.appOwnership === 'expo',
  IS_PRODUCTION: !__DEV__ && Constants.appOwnership === 'standalone',
};

// Validate required env vars
if (!env.API_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL is not set');
}