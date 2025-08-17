declare module '@env' {
  export const API_URL: string;
}

// Expo environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    // Environment type
    EXPO_PUBLIC_ENVIRONMENT?: 'development' | 'staging' | 'production';
    
    // API Configuration
    EXPO_PUBLIC_API_URL?: string;
    
    // App Configuration
    EXPO_PUBLIC_APP_NAME?: string;
    EXPO_PUBLIC_APP_SCHEME?: string;
    EXPO_PUBLIC_APP_VERSION?: string;
    
    // Optional Services
    EXPO_PUBLIC_SENTRY_DSN?: string;
    EXPO_PUBLIC_WEBSOCKET_URL?: string;
    
    // Feature Flags
    EXPO_PUBLIC_ENABLE_ANALYTICS?: string;
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING?: string;
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS?: string;
    EXPO_PUBLIC_ENABLE_LOGS?: string;
    EXPO_PUBLIC_MOCK_API?: string;
  }
}

// React Native global variables
declare const __DEV__: boolean;