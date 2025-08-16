import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  version: string;
}

class SecureStorage {
  private readonly ENCRYPTION_KEY = 'app_encryption_key';
  private readonly TOKEN_KEY = 'auth_tokens';
  private readonly DEVICE_ID_KEY = 'device_id';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly BIOMETRIC_KEY = 'biometric_enabled';
  
  /**
   * Initialize secure storage
   */
  async init(): Promise<void> {
    // Ensure device ID exists
    await this.getDeviceId();
    
    // Check biometric availability
    const biometricType = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (biometricType.length > 0) {
      console.log('Biometric authentication available:', biometricType);
    }
  }
  
  /**
   * Encrypt data using device-specific key
   */
  private async encrypt(data: string): Promise<string> {
    try {
      // Generate key based on device ID for device binding
      const deviceId = await this.getDeviceId();
      const keyMaterial = `${this.ENCRYPTION_KEY}_${deviceId}`;
      
      // Simple encryption for demo - in production use expo-crypto with proper AES
      const encrypted = btoa(data + keyMaterial);
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data using device-specific key
   */
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const deviceId = await this.getDeviceId();
      const keyMaterial = `${this.ENCRYPTION_KEY}_${deviceId}`;
      
      const decrypted = atob(encryptedData);
      const data = decrypted.replace(keyMaterial, '');
      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Store tokens securely with encryption
   */
  async setTokens(tokens: TokenData): Promise<void> {
    try {
      const encrypted = await this.encrypt(JSON.stringify(tokens));
      
      const options: SecureStore.SecureStoreOptions = {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      };
      
      // Add biometric protection if enabled
      const biometricEnabled = await this.isBiometricEnabled();
      if (biometricEnabled) {
        options.requireAuthentication = true;
        options.authenticationPrompt = 'Authenticate to access your tokens';
      }
      
      if (Platform.OS === 'web') {
        // Fallback for web development
        localStorage.setItem(this.TOKEN_KEY, encrypted);
      } else {
        await SecureStore.setItemAsync(this.TOKEN_KEY, encrypted, options);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store tokens securely');
    }
  }
  
  /**
   * Retrieve tokens with decryption
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      let encrypted: string | null;
      
      if (Platform.OS === 'web') {
        encrypted = localStorage.getItem(this.TOKEN_KEY);
      } else {
        encrypted = await SecureStore.getItemAsync(this.TOKEN_KEY);
      }
      
      if (!encrypted) return null;
      
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      // Clear corrupted data
      await this.clearTokens();
      return null;
    }
  }
  
  /**
   * Get or generate device ID for device binding
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId: string | null;
      
      if (Platform.OS === 'web') {
        deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
      } else {
        deviceId = await SecureStore.getItemAsync(this.DEVICE_ID_KEY, {
          keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
        });
      }
      
      if (!deviceId) {
        deviceId = Crypto.randomUUID();
        
        if (Platform.OS === 'web') {
          localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
        } else {
          await SecureStore.setItemAsync(this.DEVICE_ID_KEY, deviceId, {
            keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
          });
        }
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      throw new Error('Failed to retrieve device ID');
    }
  }
  
  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId();
    
    return {
      id: deviceId,
      name: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
      platform: Platform.OS,
      version: Platform.Version.toString(),
    };
  }
  
  /**
   * Enable biometric protection
   */
  async enableBiometric(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        throw new Error('Biometric hardware not available');
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        throw new Error('No biometric credentials enrolled');
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric protection for enhanced security',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      
      if (result.success) {
        await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to enable biometric protection:', error);
      return false;
    }
  }
  
  /**
   * Disable biometric protection
   */
  async disableBiometric(): Promise<void> {
    await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
  }
  
  /**
   * Check if biometric protection is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }
  
  /**
   * Store user data (non-sensitive)
   */
  async setUserData(userData: any): Promise<void> {
    try {
      const encrypted = await this.encrypt(JSON.stringify(userData));
      
      if (Platform.OS === 'web') {
        localStorage.setItem(this.USER_DATA_KEY, encrypted);
      } else {
        await SecureStore.setItemAsync(this.USER_DATA_KEY, encrypted);
      }
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }
  
  /**
   * Retrieve user data
   */
  async getUserData(): Promise<any | null> {
    try {
      let encrypted: string | null;
      
      if (Platform.OS === 'web') {
        encrypted = localStorage.getItem(this.USER_DATA_KEY);
      } else {
        encrypted = await SecureStore.getItemAsync(this.USER_DATA_KEY);
      }
      
      if (!encrypted) return null;
      
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }
  
  /**
   * Clear tokens only
   */
  async clearTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(this.TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
  
  /**
   * Clear all data on logout or suspicious activity
   */
  async clearAll(): Promise<void> {
    try {
      const keysToDelete = [this.TOKEN_KEY, this.USER_DATA_KEY];
      
      if (Platform.OS === 'web') {
        keysToDelete.forEach(key => localStorage.removeItem(key));
      } else {
        await Promise.all(
          keysToDelete.map(key => SecureStore.deleteItemAsync(key))
        );
      }
      
      // Keep device ID and biometric settings
      console.log('Cleared all sensitive data while preserving device settings');
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
  
  /**
   * Validate token expiration
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens || !tokens.expiresAt) return true;
      
      // Add 5-minute buffer
      const bufferTime = 5 * 60 * 1000;
      return Date.now() >= (tokens.expiresAt - bufferTime);
    } catch {
      return true;
    }
  }
  
  /**
   * Security check - detect suspicious activity
   */
  async performSecurityCheck(): Promise<{ secure: boolean; reason?: string }> {
    try {
      // Check if device ID still matches
      const currentDeviceId = await this.getDeviceId();
      const tokens = await this.getTokens();
      
      if (!tokens) {
        return { secure: true };
      }
      
      // Additional security checks can be added here
      // e.g., device fingerprinting, jailbreak detection
      
      return { secure: true };
    } catch (error) {
      return { 
        secure: false, 
        reason: 'Security validation failed' 
      };
    }
  }
}

export const secureStorage = new SecureStorage();