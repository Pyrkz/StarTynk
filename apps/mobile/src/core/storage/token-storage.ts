import * as SecureStore from 'expo-secure-store';
import type { UserDTO } from '@repo/shared/types';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Token storage service for mobile app
 * Provides secure storage for authentication tokens
 */
class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private readonly USER_DATA_KEY = 'userData';

  /**
   * Save tokens to secure storage
   */
  async saveTokens(data: TokenData): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, data.accessToken);
      
      if (data.refreshToken) {
        await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, data.refreshToken);
      }
      
      if (data.expiresAt) {
        await SecureStore.setItemAsync(this.TOKEN_EXPIRY_KEY, data.expiresAt.toString());
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get all token data
   */
  async getTokenData(): Promise<TokenData | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;

      const refreshToken = await this.getRefreshToken();
      const expiryStr = await SecureStore.getItemAsync(this.TOKEN_EXPIRY_KEY);
      const expiresAt = expiryStr ? parseInt(expiryStr, 10) : undefined;

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt
      };
    } catch (error) {
      console.error('Error getting token data:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;

      const expiresAt = parseInt(expiryStr, 10);
      return Date.now() >= expiresAt;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_EXPIRY_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Save user data
   */
  async saveUserData(user: UserDTO): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<UserDTO | null> {
    try {
      const userStr = await SecureStore.getItemAsync(this.USER_DATA_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr) as UserDTO;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Clear all data (tokens and user data)
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearTokens(),
        SecureStore.deleteItemAsync(this.USER_DATA_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();