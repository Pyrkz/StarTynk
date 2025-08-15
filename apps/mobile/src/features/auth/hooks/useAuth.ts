import { useAuth as useSharedAuth, usePermissions } from '@repo/features/auth';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { LoginRequestDTO } from '@repo/shared/types';
import { useCallback } from 'react';
import { tokenService } from '@repo/features/auth';

// Configure token service to use SecureStore
tokenService.setStorage({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
});

export function useAuth() {
  const router = useRouter();
  const permissions = usePermissions();
  
  const auth = useSharedAuth({
    onLoginSuccess: () => {
      router.replace('/(tabs)');
    },
    onLogoutSuccess: async () => {
      // Clear secure storage
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      router.replace('/login');
    },
  });

  // Mobile-specific login that uses the shared auth
  const login = useCallback(async (email: string, password: string) => {
    const credentials: LoginRequestDTO = { email, password };
    auth.login(credentials);
  }, [auth]);

  // Biometric authentication
  const biometricLogin = useCallback(async () => {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Zaloguj się używając biometrii',
        fallbackLabel: 'Użyj hasła',
        cancelLabel: 'Anuluj',
      });

      if (result.success) {
        // If successful, get stored credentials and login
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        const storedToken = await SecureStore.getItemAsync('refreshToken');
        
        if (storedEmail && storedToken) {
          // Refresh the token instead of full login
          await auth.refreshToken();
        } else {
          throw new Error('No stored credentials found');
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Biometric login failed:', error);
      return false;
    }
  }, [auth]);

  // Check if biometric login is available
  const checkBiometricAvailability = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch {
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }, []);

  return {
    ...auth,
    ...permissions,
    // Override specific methods for mobile compatibility
    login,
    // Add mobile-specific methods
    biometricLogin,
    checkBiometricAvailability,
    navigateToHome: () => router.replace('/(tabs)'),
    navigateToLogin: () => router.replace('/login'),
    navigateToProfile: () => router.push('/profile'),
  };
}