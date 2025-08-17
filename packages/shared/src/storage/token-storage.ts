import { UnifiedStorage } from './storage.interface';
import { TokenStorageInterface, TokenData } from './token-storage.interface';

/**
 * Unified token storage implementation that works with any UnifiedStorage provider
 */
export class TokenStorage implements TokenStorageInterface {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private readonly USER_DATA_KEY = 'userData';

  constructor(private storage: UnifiedStorage) {}

  /**
   * Save tokens to secure storage
   */
  async saveTokens(data: TokenData): Promise<void> {
    try {
      // Use secure storage for sensitive tokens
      await this.storage.setSecureItem(this.ACCESS_TOKEN_KEY, data.accessToken);
      
      if (data.refreshToken) {
        await this.storage.setSecureItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
      }
      
      if (data.expiresAt) {
        await this.storage.setNumber(this.TOKEN_EXPIRY_KEY, data.expiresAt);
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
      return await this.storage.getSecureItem(this.ACCESS_TOKEN_KEY);
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
      return await this.storage.getSecureItem(this.REFRESH_TOKEN_KEY);
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
      const expiresAt = await this.storage.getNumber(this.TOKEN_EXPIRY_KEY);

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: expiresAt || undefined
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
      const expiresAt = await this.storage.getNumber(this.TOKEN_EXPIRY_KEY);
      if (!expiresAt) return true;

      // Add 5-minute buffer
      const bufferTime = 5 * 60 * 1000;
      return Date.now() >= (expiresAt - bufferTime);
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
        this.storage.removeSecureItem(this.ACCESS_TOKEN_KEY),
        this.storage.removeSecureItem(this.REFRESH_TOKEN_KEY),
        this.storage.removeItem(this.TOKEN_EXPIRY_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Save user data
   */
  async saveUserData(user: any): Promise<void> {
    try {
      await this.storage.setObject(this.USER_DATA_KEY, user);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<any | null> {
    try {
      return await this.storage.getObject(this.USER_DATA_KEY);
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
        this.storage.removeItem(this.USER_DATA_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}