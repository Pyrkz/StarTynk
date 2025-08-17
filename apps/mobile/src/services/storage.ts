import * as SecureStore from 'expo-secure-store';
import type { User } from '@repo/shared/types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  USER_EMAIL: 'userEmail',
  TOKEN_EXPIRY: 'tokenExpiry',
} as const;

/**
 * Storage service for mobile app
 * Provides a simple key-value storage interface using expo-secure-store
 */
class StorageService {
  /**
   * Get an item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set an item in secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove an item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all items (not supported by SecureStore, so we track keys)
   */
  async clear(): Promise<void> {
    // SecureStore doesn't support clearing all items
    // You need to track and remove individual keys
    const keysToRemove = Object.values(STORAGE_KEYS);

    await Promise.all(
      keysToRemove.map(key => this.removeItem(key).catch(() => {}))
    );
  }

  // Auth specific methods for backward compatibility
  
  /**
   * Set auth token (same as access token)
   */
  async setAuthToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    // Try auth token first, then access token
    const authToken = await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (authToken) return authToken;
    
    return await this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Set user data
   */
  async setUserData(user: User): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    // Also store email separately for convenience
    if (user.email) {
      await this.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
    }
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<User | null> {
    try {
      const userData = await this.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return null;
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Clear all auth-related data
   */
  async clearAll(): Promise<void> {
    await this.clear();
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;

// Also export as named export for compatibility
export { storageService };