import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_DATA_KEY = 'user_data';

  // Use SecureStore for sensitive data on physical devices
  private async setSecure(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback for web platform during development
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
    } catch (error) {
      console.error(`Failed to save ${key} securely:`, error);
      throw error;
    }
  }

  private async getSecure(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  private async deleteSecure(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }

  // Token management methods
  async saveTokens(tokens: TokenData): Promise<void> {
    await this.setSecure(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    
    if (tokens.refreshToken) {
      await this.setSecure(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    
    if (tokens.expiresAt) {
      await AsyncStorage.setItem(this.TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    }
  }

  async getAccessToken(): Promise<string | null> {
    return this.getSecure(this.ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getSecure(this.REFRESH_TOKEN_KEY);
  }

  async getTokenExpiry(): Promise<number | null> {
    const expiry = await AsyncStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }

  async isTokenExpired(): Promise<boolean> {
    const expiry = await this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= expiry;
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.deleteSecure(this.ACCESS_TOKEN_KEY),
      this.deleteSecure(this.REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(this.TOKEN_EXPIRY_KEY),
      AsyncStorage.removeItem(this.USER_DATA_KEY),
    ]);
  }

  // User data management (non-sensitive)
  async saveUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async clearAll(): Promise<void> {
    await this.clearTokens();
    // Clear other app data if needed
  }
}

export const tokenStorage = new TokenStorage();