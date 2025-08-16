import { secureStorage } from '../../lib/storage/secure-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('expo-crypto');
jest.mock('expo-local-authentication');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

describe('SecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto functions
    mockCrypto.randomUUID.mockReturnValue('test-device-id-123');
    
    // Mock secure store
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe('Token Management', () => {
    it('should store and retrieve tokens securely', async () => {
      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      await secureStorage.setTokens(tokens);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_tokens',
        expect.any(String),
        expect.objectContaining({
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
      );

      // Mock the encrypted return value
      const encryptedData = 'encrypted-token-data';
      mockSecureStore.getItemAsync.mockResolvedValue(encryptedData);

      // Mock decryption to return original tokens
      jest.spyOn(secureStorage as any, 'decrypt').mockResolvedValue(JSON.stringify(tokens));

      const retrievedTokens = await secureStorage.getTokens();
      expect(retrievedTokens).toEqual(tokens);
    });

    it('should handle corrupted token data gracefully', async () => {
      // Mock corrupted data
      mockSecureStore.getItemAsync.mockResolvedValue('corrupted-data');
      jest.spyOn(secureStorage as any, 'decrypt').mockRejectedValue(new Error('Decryption failed'));

      const tokens = await secureStorage.getTokens();
      expect(tokens).toBeNull();

      // Should clear corrupted data
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('should check token expiration correctly', async () => {
      const expiredTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // Expired
      };

      jest.spyOn(secureStorage, 'getTokens').mockResolvedValue(expiredTokens);

      const isExpired = await secureStorage.isTokenExpired();
      expect(isExpired).toBe(true);
    });

    it('should consider tokens expired with buffer time', async () => {
      const almostExpiredTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 60000, // 1 minute (less than 5-minute buffer)
      };

      jest.spyOn(secureStorage, 'getTokens').mockResolvedValue(almostExpiredTokens);

      const isExpired = await secureStorage.isTokenExpired();
      expect(isExpired).toBe(true);
    });
  });

  describe('Device Management', () => {
    it('should generate and store device ID', async () => {
      const deviceId = await secureStorage.getDeviceId();

      expect(deviceId).toBe('test-device-id-123');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'device_id',
        'test-device-id-123',
        expect.objectContaining({
          keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
        })
      );
    });

    it('should reuse existing device ID', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('existing-device-id');

      const deviceId = await secureStorage.getDeviceId();

      expect(deviceId).toBe('existing-device-id');
      expect(mockCrypto.randomUUID).not.toHaveBeenCalled();
    });

    it('should provide device info', async () => {
      jest.spyOn(secureStorage, 'getDeviceId').mockResolvedValue('device-123');

      const deviceInfo = await secureStorage.getDeviceInfo();

      expect(deviceInfo).toEqual({
        id: 'device-123',
        name: expect.any(String),
        platform: expect.any(String),
        version: expect.any(String),
      });
    });
  });

  describe('Biometric Authentication', () => {
    it('should enable biometric protection when supported', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });

      const result = await secureStorage.enableBiometric();

      expect(result).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_enabled',
        'true'
      );
    });

    it('should fail when biometric hardware not available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

      const result = await secureStorage.enableBiometric();

      expect(result).toBe(false);
    });

    it('should fail when no biometric credentials enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

      const result = await secureStorage.enableBiometric();

      expect(result).toBe(false);
    });

    it('should check biometric status correctly', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('true');

      const isEnabled = await secureStorage.isBiometricEnabled();

      expect(isEnabled).toBe(true);
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const testData = { sensitive: 'information' };
      
      // Mock device ID for encryption key
      jest.spyOn(secureStorage, 'getDeviceId').mockResolvedValue('device-123');

      await secureStorage.setUserData(testData);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        expect.any(String) // Encrypted data
      );

      // Mock encrypted data retrieval
      mockSecureStore.getItemAsync.mockResolvedValue('encrypted-user-data');
      jest.spyOn(secureStorage as any, 'decrypt').mockResolvedValue(JSON.stringify(testData));

      const retrievedData = await secureStorage.getUserData();
      expect(retrievedData).toEqual(testData);
    });

    it('should handle encryption failures gracefully', async () => {
      jest.spyOn(secureStorage as any, 'encrypt').mockRejectedValue(new Error('Encryption failed'));

      await expect(secureStorage.setUserData({ test: 'data' })).rejects.toThrow('Failed to store user data');
    });

    it('should handle decryption failures gracefully', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('corrupted-data');
      jest.spyOn(secureStorage as any, 'decrypt').mockRejectedValue(new Error('Decryption failed'));

      const data = await secureStorage.getUserData();
      expect(data).toBeNull();
    });
  });

  describe('Security Checks', () => {
    it('should perform security validation', async () => {
      jest.spyOn(secureStorage, 'getDeviceId').mockResolvedValue('device-123');
      jest.spyOn(secureStorage, 'getTokens').mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
      });

      const result = await secureStorage.performSecurityCheck();

      expect(result.secure).toBe(true);
    });

    it('should detect security issues', async () => {
      jest.spyOn(secureStorage, 'getDeviceId').mockRejectedValue(new Error('Device ID error'));

      const result = await secureStorage.performSecurityCheck();

      expect(result.secure).toBe(false);
      expect(result.reason).toBe('Security validation failed');
    });
  });

  describe('Data Cleanup', () => {
    it('should clear tokens only', async () => {
      await secureStorage.clearTokens();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_tokens');
    });

    it('should clear all sensitive data', async () => {
      await secureStorage.clearAll();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_tokens');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should preserve device settings during cleanup', async () => {
      await secureStorage.clearAll();

      // Device ID and biometric settings should not be cleared
      expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalledWith('device_id');
      expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalledWith('biometric_enabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureStore errors gracefully', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Keychain error'));

      await expect(secureStorage.setTokens({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
      })).rejects.toThrow('Failed to store tokens securely');
    });

    it('should handle missing tokens gracefully', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const tokens = await secureStorage.getTokens();
      expect(tokens).toBeNull();

      const isExpired = await secureStorage.isTokenExpired();
      expect(isExpired).toBe(true);
    });
  });
});