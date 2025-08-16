import { 
  UnifiedStorage, 
  StorageInfo, 
  StorageConfig, 
  StorageError, 
  StorageErrorCode 
} from './storage.interface';

/**
 * Web storage implementation using localStorage and sessionStorage
 * Provides fallback mechanisms and optional encryption
 */
export class WebStorage implements UnifiedStorage {
  private config: StorageConfig;
  private memoryFallback: Map<string, string> = new Map();
  private secureMemoryFallback: Map<string, string> = new Map();

  constructor(config: StorageConfig = {}) {
    this.config = {
      keyPrefix: 'app_',
      secureKeyPrefix: 'secure_',
      enableEncryption: false,
      web: {
        useSessionStorage: false,
        fallbackToMemory: true,
      },
      ...config,
    };
  }

  // Base storage operations
  async setItem(key: string, value: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const storage = this.getStorage();
      storage.setItem(prefixedKey, value);
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.memoryFallback.set(prefixedKey, value);
      } else {
        throw this.handleError(error, 'setItem');
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const storage = this.getStorage();
      const value = storage.getItem(prefixedKey);
      return value;
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        return this.memoryFallback.get(prefixedKey) || null;
      } else {
        throw this.handleError(error, 'getItem');
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const storage = this.getStorage();
      storage.removeItem(prefixedKey);
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.memoryFallback.delete(prefixedKey);
      } else {
        throw this.handleError(error, 'removeItem');
      }
    }
  }

  async clear(): Promise<void> {
    try {
      const storage = this.getStorage();
      const keys = Object.keys(storage);
      const prefix = this.config.keyPrefix || '';
      
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          storage.removeItem(key);
        }
      }
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.memoryFallback.clear();
      } else {
        throw this.handleError(error, 'clear');
      }
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const storage = this.getStorage();
      const allKeys = Object.keys(storage);
      const prefix = this.config.keyPrefix || '';
      
      return allKeys
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        const prefix = this.config.keyPrefix || '';
        return Array.from(this.memoryFallback.keys())
          .filter(key => key.startsWith(prefix))
          .map(key => key.substring(prefix.length));
      } else {
        throw this.handleError(error, 'getAllKeys');
      }
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const results: Array<[string, string | null]> = [];
    
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    
    return results;
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  // Secure storage operations (using localStorage with encryption prefix)
  async setSecureItem(key: string, value: string): Promise<void> {
    const secureKey = this.getSecurePrefixedKey(key);
    const encryptedValue = this.config.enableEncryption 
      ? this.encrypt(value) 
      : value;
    
    try {
      const storage = this.getStorage();
      storage.setItem(secureKey, encryptedValue);
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.secureMemoryFallback.set(secureKey, encryptedValue);
      } else {
        throw this.handleError(error, 'setSecureItem');
      }
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    const secureKey = this.getSecurePrefixedKey(key);
    
    try {
      const storage = this.getStorage();
      const encryptedValue = storage.getItem(secureKey);
      
      if (!encryptedValue) return null;
      
      return this.config.enableEncryption 
        ? this.decrypt(encryptedValue) 
        : encryptedValue;
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        const encryptedValue = this.secureMemoryFallback.get(secureKey);
        if (!encryptedValue) return null;
        
        return this.config.enableEncryption 
          ? this.decrypt(encryptedValue) 
          : encryptedValue;
      } else {
        throw this.handleError(error, 'getSecureItem');
      }
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    const secureKey = this.getSecurePrefixedKey(key);
    
    try {
      const storage = this.getStorage();
      storage.removeItem(secureKey);
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.secureMemoryFallback.delete(secureKey);
      } else {
        throw this.handleError(error, 'removeSecureItem');
      }
    }
  }

  async clearSecureStorage(): Promise<void> {
    try {
      const storage = this.getStorage();
      const keys = Object.keys(storage);
      const securePrefix = this.config.secureKeyPrefix || 'secure_';
      
      for (const key of keys) {
        if (key.includes(securePrefix)) {
          storage.removeItem(key);
        }
      }
    } catch (error) {
      if (this.config.web?.fallbackToMemory) {
        this.secureMemoryFallback.clear();
      } else {
        throw this.handleError(error, 'clearSecureStorage');
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const storage = this.getStorage();
      const test = '__storage_test__';
      storage.setItem(test, 'test');
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Convenience methods
  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setNumber(key: string, value: number): Promise<void> {
    await this.setItem(key, value.toString());
  }

  async getNumber(key: string): Promise<number | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }

  async setBoolean(key: string, value: boolean): Promise<void> {
    await this.setItem(key, value.toString());
  }

  async getBoolean(key: string): Promise<boolean | null> {
    const value = await this.getItem(key);
    if (value === null) return null;
    
    return value === 'true';
  }

  async setBatch(items: Record<string, any>): Promise<void> {
    const pairs: Array<[string, string]> = Object.entries(items).map(
      ([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]
    );
    await this.multiSet(pairs);
  }

  async getBatch(keys: string[]): Promise<Record<string, any>> {
    const results = await this.multiGet(keys);
    const batch: Record<string, any> = {};
    
    for (const [key, value] of results) {
      if (value !== null) {
        try {
          batch[key] = JSON.parse(value);
        } catch {
          batch[key] = value;
        }
      }
    }
    
    return batch;
  }

  async getSize(): Promise<number> {
    try {
      const storage = this.getStorage();
      let totalSize = 0;
      
      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          totalSize += key.length + (storage.getItem(key) || '').length;
        }
      }
      
      return totalSize;
    } catch {
      return 0;
    }
  }

  async getInfo(): Promise<StorageInfo> {
    const keys = await this.getAllKeys();
    const size = await this.getSize();
    const secureAvailable = await this.isAvailable();
    
    return {
      totalKeys: keys.length,
      estimatedSize: size,
      platform: 'web',
      secureStorageAvailable: secureAvailable,
      encryptionEnabled: this.config.enableEncryption || false,
    };
  }

  // Private helper methods
  private getStorage(): Storage {
    if (typeof window === 'undefined') {
      throw new StorageError('Storage not available in server environment', StorageErrorCode.NOT_AVAILABLE, 'web');
    }
    
    return this.config.web?.useSessionStorage ? sessionStorage : localStorage;
  }

  private getPrefixedKey(key: string): string {
    return `${this.config.keyPrefix || ''}${key}`;
  }

  private getSecurePrefixedKey(key: string): string {
    return `${this.config.keyPrefix || ''}${this.config.secureKeyPrefix || 'secure_'}${key}`;
  }

  private encrypt(value: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    if (!this.config.encryptionKey) return value;
    
    const key = this.config.encryptionKey;
    let encrypted = '';
    
    for (let i = 0; i < value.length; i++) {
      encrypted += String.fromCharCode(
        value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(encrypted);
  }

  private decrypt(encryptedValue: string): string {
    // Simple XOR decryption for demo - use proper encryption in production
    if (!this.config.encryptionKey) return encryptedValue;
    
    try {
      const key = this.config.encryptionKey;
      const encrypted = atob(encryptedValue);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      
      return decrypted;
    } catch {
      return encryptedValue; // Return as-is if decryption fails
    }
  }

  private handleError(error: any, operation: string): StorageError {
    if (error.name === 'QuotaExceededError') {
      return new StorageError(`Storage quota exceeded during ${operation}`, StorageErrorCode.QUOTA_EXCEEDED, 'web');
    }
    
    if (error.name === 'SecurityError') {
      return new StorageError(`Storage access denied during ${operation}`, StorageErrorCode.PERMISSION_DENIED, 'web');
    }
    
    return new StorageError(`Storage error during ${operation}: ${error.message}`, StorageErrorCode.UNKNOWN_ERROR, 'web');
  }
}