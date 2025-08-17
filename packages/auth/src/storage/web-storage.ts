import type { AuthTokens, StoredUser } from './storage.interface';
import { AuthStorage } from './storage.interface';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth:access_token',
  REFRESH_TOKEN: 'auth:refresh_token',
  USER: 'auth:user',
  TOKEN_EXPIRES: 'auth:token_expires',
} as const;

export class WebAuthStorage extends AuthStorage {
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getStorage(): Storage | null {
    if (this.isLocalStorageAvailable()) {
      return window.localStorage;
    }
    return null;
  }

  async getTokens(): Promise<AuthTokens | null> {
    const storage = this.getStorage();
    if (!storage) return null;

    const accessToken = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const expiresStr = storage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);

    if (!accessToken || !refreshToken) return null;

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresStr ? parseInt(expiresStr, 10) : undefined,
      tokenType: 'Bearer',
    };
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    const storage = this.getStorage();
    if (!storage) throw new Error('Storage not available');

    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    
    if (tokens.expiresIn) {
      const expiresAt = Date.now() + tokens.expiresIn * 1000;
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString());
    }
  }

  async removeTokens(): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
  }

  async getUser(): Promise<StoredUser | null> {
    const storage = this.getStorage();
    if (!storage) return null;

    const userStr = storage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  async setUser(user: StoredUser): Promise<void> {
    const storage = this.getStorage();
    if (!storage) throw new Error('Storage not available');

    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(STORAGE_KEYS.USER);
  }

  async clear(): Promise<void> {
    await this.removeTokens();
    await this.removeUser();
  }
}