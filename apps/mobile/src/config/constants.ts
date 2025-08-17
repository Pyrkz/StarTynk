import { API_BASE_URL } from './api.config';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@startynk_auth_token',
  USER_DATA: '@startynk_user_data',
  APP_SETTINGS: '@startynk_settings',
};

export const APP_CONFIG = {
  APP_NAME: 'StarTynk',
  VERSION: '1.0.0',
  MIN_PASSWORD_LENGTH: 8,
  LOADING_TIMEOUT: 2000, // ms
};