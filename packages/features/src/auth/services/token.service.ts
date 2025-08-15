export interface TokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class TokenService {
  private storage?: TokenStorage;
  private memoryTokens: { access?: string; refresh?: string } = {};

  setStorage(storage: TokenStorage) {
    this.storage = storage;
  }

  async getAccessToken(): Promise<string | null> {
    if (this.storage) {
      return this.storage.getItem('accessToken');
    }
    return this.memoryTokens.access || null;
  }

  async getRefreshToken(): Promise<string | null> {
    if (this.storage) {
      return this.storage.getItem('refreshToken');
    }
    return this.memoryTokens.refresh || null;
  }

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    if (this.storage) {
      await this.storage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await this.storage.setItem('refreshToken', refreshToken);
      }
    } else {
      this.memoryTokens.access = accessToken;
      if (refreshToken) {
        this.memoryTokens.refresh = refreshToken;
      }
    }
  }

  async clearTokens(): Promise<void> {
    if (this.storage) {
      await this.storage.removeItem('accessToken');
      await this.storage.removeItem('refreshToken');
    }
    this.memoryTokens = {};
  }

  async isTokenExpired(token: string): Promise<boolean> {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}

export const tokenService = new TokenService();