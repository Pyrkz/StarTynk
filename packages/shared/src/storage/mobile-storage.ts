import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';
import { 
  UnifiedStorage, 
  StorageInfo, 
  StorageConfig, 
  StorageError, 
  StorageErrorCode 
} from './storage.interface';

/**
 * Mobile storage implementation using MMKV for regular data and SecureStore for sensitive data
 * Provides automatic encryption and high performance
 */
export class MobileStorage implements UnifiedStorage {
  private config: StorageConfig;
  private mmkv: MMKV;
  private secureMmkv: MMKV;

  constructor(config: StorageConfig = {}) {
    this.config = {
      keyPrefix: 'app_',
      secureKeyPrefix: 'secure_',
      enableEncryption: true,
      mobile: {
        mmkvInstanceId: 'default',
        secureStoreOptions: {},
      },
      ...config,
    };

    // Initialize MMKV instances
    this.mmkv = new MMKV({
      id: this.config.mobile?.mmkvInstanceId || 'default',
      encryptionKey: this.config.enableEncryption ? this.config.encryptionKey : undefined,
    });

    this.secureMmkv = new MMKV({
      id: `${this.config.mobile?.mmkvInstanceId || 'default'}_secure`,
      encryptionKey: this.config.encryptionKey || 'default-secure-key',
    });
  }

  // Base storage operations using MMKV
  async setItem(key: string, value: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      this.mmkv.set(prefixedKey, value);
    } catch (error) {
      throw this.handleError(error, 'setItem');
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const value = this.mmkv.getString(prefixedKey);
      return value || null;
    } catch (error) {
      throw this.handleError(error, 'getItem');
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      this.mmkv.delete(prefixedKey);
    } catch (error) {
      throw this.handleError(error, 'removeItem');
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear only items with our prefix
      const allKeys = this.mmkv.getAllKeys();
      const prefix = this.config.keyPrefix || '';
      
      for (const key of allKeys) {
        if (key.startsWith(prefix)) {
          this.mmkv.delete(key);
        }
      }
    } catch (error) {
      throw this.handleError(error, 'clear');
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = this.mmkv.getAllKeys();
      const prefix = this.config.keyPrefix || '';
      
      return allKeys
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    } catch (error) {
      throw this.handleError(error, 'getAllKeys');
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

  // Secure storage operations using Expo SecureStore
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const secureKey = this.getSecurePrefixedKey(key);
      await SecureStore.setItemAsync(secureKey, value, this.config.mobile?.secureStoreOptions);
    } catch (error) {
      throw this.handleError(error, 'setSecureItem');
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      const secureKey = this.getSecurePrefixedKey(key);
      const value = await SecureStore.getItemAsync(secureKey, this.config.mobile?.secureStoreOptions);
      return value;
    } catch (error) {
      // SecureStore throws if item doesn't exist
      if (error.message?.includes('not found')) {
        return null;
      }
      throw this.handleError(error, 'getSecureItem');
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      const secureKey = this.getSecurePrefixedKey(key);
      await SecureStore.deleteItemAsync(secureKey, this.config.mobile?.secureStoreOptions);
    } catch (error) {
      // Ignore if item doesn't exist
      if (!error.message?.includes('not found')) {
        throw this.handleError(error, 'removeSecureItem');
      }
    }
  }

  async clearSecureStorage(): Promise<void> {
    try {
      // Clear secure MMKV instance
      this.secureMmkv.clearAll();
      
      // Note: SecureStore doesn't provide a way to list all keys
      // We could maintain an index, but for now we'll clear known keys
      const commonSecureKeys = [
        'accessToken', 'refreshToken', 'deviceId', 
        'biometricKey', 'encryptionKey', 'userId'
      ];
      
      for (const key of commonSecureKeys) {
        try {
          await this.removeSecureItem(key);
        } catch {
          // Ignore errors for keys that don't exist
        }
      }
    } catch (error) {
      throw this.handleError(error, 'clearSecureStorage');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test MMKV
      const testKey = '__test_key__';
      this.mmkv.set(testKey, 'test');
      this.mmkv.delete(testKey);
      
      // Test SecureStore
      await SecureStore.isAvailableAsync();
      
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
    try {
      const prefixedKey = this.getPrefixedKey(key);
      this.mmkv.set(prefixedKey, value);
    } catch (error) {
      throw this.handleError(error, 'setNumber');
    }
  }

  async getNumber(key: string): Promise<number | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const value = this.mmkv.getNumber(prefixedKey);
      return value !== undefined ? value : null;
    } catch (error) {
      throw this.handleError(error, 'getNumber');
    }
  }

  async setBoolean(key: string, value: boolean): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      this.mmkv.set(prefixedKey, value);
    } catch (error) {
      throw this.handleError(error, 'setBoolean');
    }
  }

  async getBoolean(key: string): Promise<boolean | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const value = this.mmkv.getBoolean(prefixedKey);
      return value !== undefined ? value : null;
    } catch (error) {
      throw this.handleError(error, 'getBoolean');
    }
  }

  async setBatch(items: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      if (typeof value === 'string') {
        await this.setItem(key, value);
      } else if (typeof value === 'number') {
        await this.setNumber(key, value);
      } else if (typeof value === 'boolean') {
        await this.setBoolean(key, value);
      } else {
        await this.setObject(key, value);
      }
    }
  }

  async getBatch(keys: string[]): Promise<Record<string, any>> {
    const batch: Record<string, any> = {};
    
    for (const key of keys) {
      const prefixedKey = this.getPrefixedKey(key);
      
      // Try different types
      const stringValue = this.mmkv.getString(prefixedKey);
      const numberValue = this.mmkv.getNumber(prefixedKey);
      const booleanValue = this.mmkv.getBoolean(prefixedKey);
      
      if (stringValue !== undefined) {
        try {
          batch[key] = JSON.parse(stringValue);
        } catch {
          batch[key] = stringValue;
        }
      } else if (numberValue !== undefined) {
        batch[key] = numberValue;
      } else if (booleanValue !== undefined) {
        batch[key] = booleanValue;
      }
    }
    
    return batch;
  }

  async getSize(): Promise<number> {
    try {
      // MMKV doesn't provide direct size info, estimate based on keys
      const keys = this.mmkv.getAllKeys();
      let estimatedSize = 0;
      
      for (const key of keys) {
        const value = this.mmkv.getString(key);
        if (value) {
          estimatedSize += key.length + value.length;
        }
      }
      
      return estimatedSize;
    } catch {
      return 0;
    }
  }

  async getInfo(): Promise<StorageInfo> {
    const keys = await this.getAllKeys();
    const size = await this.getSize();
    const secureAvailable = await SecureStore.isAvailableAsync();
    
    return {
      totalKeys: keys.length,
      estimatedSize: size,
      platform: 'mobile',
      secureStorageAvailable: secureAvailable,
      encryptionEnabled: this.config.enableEncryption || false,
    };
  }

  // Private helper methods
  private getPrefixedKey(key: string): string {
    return `${this.config.keyPrefix || ''}${key}`;
  }

  private getSecurePrefixedKey(key: string): string {
    return `${this.config.keyPrefix || ''}${this.config.secureKeyPrefix || 'secure_'}${key}`;
  }

  private handleError(error: any, operation: string): StorageError {
    if (error.message?.includes('quota') || error.message?.includes('full')) {
      return new StorageError(`Storage quota exceeded during ${operation}`, StorageErrorCode.QUOTA_EXCEEDED, 'mobile');
    }
    
    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      return new StorageError(`Storage access denied during ${operation}`, StorageErrorCode.PERMISSION_DENIED, 'mobile');
    }
    
    if (error.message?.includes('encryption')) {
      return new StorageError(`Encryption failed during ${operation}`, StorageErrorCode.ENCRYPTION_FAILED, 'mobile');
    }
    
    return new StorageError(`Storage error during ${operation}: ${error.message}`, StorageErrorCode.UNKNOWN_ERROR, 'mobile');
  }
}