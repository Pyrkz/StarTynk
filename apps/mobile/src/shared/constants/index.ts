export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.startynk.com';

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@startynk/auth_token',
  REFRESH_TOKEN: '@startynk/refresh_token',
  USER_DATA: '@startynk/user_data',
  REMEMBER_ME: '@startynk/remember_me',
} as const;

export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  APP: {
    HOME: '/(app)/home',
    PROFILE: '/(app)/profile',
    SETTINGS: '/(app)/settings',
  },
} as const;