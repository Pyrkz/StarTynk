import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { 
  UnifiedLoginRequest, 
  UnifiedAuthResponse, 
  RefreshTokenResponse,
  SessionResponse 
} from '@repo/shared/types';

/**
 * Generate a unique device ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class AuthClient {
  private baseURL: string;
  private deviceId: string | null = null;
  
  constructor() {
    // Use the API URL from environment or default
    this.baseURL = Constants.expoConfig?.extra?.apiUrl || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   'http://localhost:3000/api';
  }
  
  /**
   * Initialize the auth client
   */
  async init() {
    // Get or generate device ID
    this.deviceId = await this.getDeviceId();
  }
  
  /**
   * Login with email/phone and password
   */
  async login(identifier: string, password: string, rememberMe: boolean = false) {
    // Auto-detect login method
    const loginMethod = this.detectLoginMethod(identifier);
    
    const request: UnifiedLoginRequest = {
      identifier,
      password,
      loginMethod,
      deviceId: await this.getDeviceId(),
      rememberMe,
    };
    
    const response = await fetch(`${this.baseURL}/auth/unified-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
        'User-Agent': this.getUserAgent(),
      },
      body: JSON.stringify(request),
    });
    
    const data: UnifiedAuthResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    if (data.success && data.accessToken && data.refreshToken) {
      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await SecureStore.setItemAsync('loginMethod', loginMethod);
      
      // Store user data
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    }
    
    return data;
  }
  
  /**
   * Register a new user
   */
  async register(
    email?: string, 
    phone?: string, 
    password?: string, 
    name?: string
  ) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
        'User-Agent': this.getUserAgent(),
      },
      body: JSON.stringify({ email, phone, password, name }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Mobile auto-login after registration
    if (data.success && data.accessToken && data.refreshToken) {
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    }
    
    return data;
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
        'User-Agent': this.getUserAgent(),
      },
      body: JSON.stringify({
        refreshToken,
        deviceId: await this.getDeviceId(),
      }),
    });
    
    const data: RefreshTokenResponse = await response.json();
    
    if (!response.ok) {
      // Clear tokens on refresh failure
      await this.logout();
      throw new Error(data.error || 'Token refresh failed');
    }
    
    if (data.success && data.accessToken && data.refreshToken) {
      // Update tokens
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    }
    
    return data;
  }
  
  /**
   * Get current session/user
   */
  async getSession(): Promise<SessionResponse> {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) {
      return {
        success: true,
        user: null,
        isAuthenticated: false,
      };
    }
    
    const response = await fetch(`${this.baseURL}/auth/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-Type': 'mobile',
        'User-Agent': this.getUserAgent(),
      },
    });
    
    const data: SessionResponse = await response.json();
    
    if (!response.ok && response.status === 401) {
      // Try to refresh token
      try {
        await this.refreshToken();
        // Retry with new token
        return this.getSession();
      } catch {
        await this.logout();
        return {
          success: true,
          user: null,
          isAuthenticated: false,
        };
      }
    }
    
    return data;
  }
  
  /**
   * Logout user
   */
  async logout() {
    const token = await SecureStore.getItemAsync('accessToken');
    
    // Call logout endpoint
    if (token) {
      try {
        await fetch(`${this.baseURL}/auth/unified-logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-Type': 'mobile',
            'User-Agent': this.getUserAgent(),
          },
        });
      } catch {
        // Ignore logout errors
      }
    }
    
    // Clear stored data
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('loginMethod');
  }
  
  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync('accessToken');
  }
  
  /**
   * Get stored user
   */
  async getUser() {
    const userJson = await SecureStore.getItemAsync('user');
    return userJson ? JSON.parse(userJson) : null;
  }
  
  /**
   * Create authenticated fetch
   */
  async authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Client-Type': 'mobile',
        'User-Agent': this.getUserAgent(),
      },
    });
    
    // Handle 401 errors
    if (response.status === 401) {
      try {
        await this.refreshToken();
        // Retry with new token
        const newToken = await this.getAccessToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': newToken ? `Bearer ${newToken}` : '',
            'X-Client-Type': 'mobile',
            'User-Agent': this.getUserAgent(),
          },
        });
      } catch {
        await this.logout();
        throw new Error('Authentication required');
      }
    }
    
    return response;
  }
  
  /**
   * Detect if identifier is email or phone
   */
  private detectLoginMethod(identifier: string): 'email' | 'phone' {
    return identifier.includes('@') ? 'email' : 'phone';
  }
  
  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;
    
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
      deviceId = generateUUID();
      await SecureStore.setItemAsync('deviceId', deviceId);
    }
    
    this.deviceId = deviceId;
    return deviceId;
  }
  
  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    const appName = Constants.expoConfig?.name || 'StarTynk';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const platform = Platform.OS;
    const platformVersion = Platform.Version;
    
    return `${appName}/${appVersion} (${platform} ${platformVersion}; Expo)`;
  }
}

// Export singleton instance
export const authClient = new AuthClient();