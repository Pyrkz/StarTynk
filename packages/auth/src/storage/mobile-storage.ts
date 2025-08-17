import type { AuthTokens, StoredUser } from './storage.interface';
import { AuthStorage } from './storage.interface';

// Mock implementation for server-side rendering
// Real implementation should be in the mobile app using Expo SecureStore or MMKV
export class MobileAuthStorage extends AuthStorage {
  private storage: Map<string, string> = new Map();

  async getTokens(): Promise<AuthTokens | null> {
    // This is a mock implementation for server-side
    // Real mobile implementation should use Expo SecureStore or MMKV
    const accessToken = this.storage.get('access_token');
    const refreshToken = this.storage.get('refresh_token');
    const expiresIn = this.storage.get('expires_in');

    if (!accessToken || !refreshToken) return null;

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresIn ? parseInt(expiresIn, 10) : undefined,
      tokenType: 'Bearer',
    };
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.storage.set('access_token', tokens.accessToken);
    this.storage.set('refresh_token', tokens.refreshToken);
    
    if (tokens.expiresIn) {
      this.storage.set('expires_in', tokens.expiresIn.toString());
    }
  }

  async removeTokens(): Promise<void> {
    this.storage.delete('access_token');
    this.storage.delete('refresh_token');
    this.storage.delete('expires_in');
  }

  async getUser(): Promise<StoredUser | null> {
    const userStr = this.storage.get('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  async setUser(user: StoredUser): Promise<void> {
    this.storage.set('user', JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    this.storage.delete('user');
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}