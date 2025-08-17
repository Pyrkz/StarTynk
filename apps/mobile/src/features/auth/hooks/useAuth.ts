import { useAuth as useSharedAuth, usePermissions, tokenService } from '@repo/features/auth';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { LoginRequestDTO, LoginMethod, ClientType, UnifiedUserDTO } from '@repo/shared/types';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Configure token service to use SecureStore for mobile
tokenService.setStorage({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
});

export function useAuth() {
  const router = useRouter();
  const permissions = usePermissions();
  const [biometricInfo, setBiometricInfo] = useState<{
    available: boolean;
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  } | null>(null);
  
  const auth = useSharedAuth({
    onLoginSuccess: async (user: UnifiedUserDTO) => {
      console.log('🔵 Mobile auth - Login success, navigating to tabs');
      // Store user identifier for biometric login
      await SecureStore.setItemAsync('userIdentifier', user.email || user.id);
      router.replace('/(tabs)');
    },
    onLoginError: (error: Error) => {
      console.error('🔴 Mobile auth - Login error:', error);
      Alert.alert('Błąd logowania', error.message || 'Nie udało się zalogować. Spróbuj ponownie.');
    },
    onLogoutSuccess: async () => {
      console.log('🔵 Mobile auth - Logout success, clearing storage and navigating to login');
      // Clear all secure storage
      try {
        await Promise.all([
          SecureStore.deleteItemAsync('accessToken'),
          SecureStore.deleteItemAsync('refreshToken'),
          SecureStore.deleteItemAsync('userIdentifier'),
        ]);
      } catch (error) {
        console.warn('Failed to clear some secure storage items:', error);
      }
      router.replace('/login');
    },
  });

  // Initialize biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability().then(setBiometricInfo);
  }, []);

  // Enhanced mobile-specific login
  const login = useCallback(async (identifier: string, password: string, loginMethod: LoginMethod = LoginMethod.EMAIL) => {
    try {
      const credentials: LoginRequestDTO = { 
        identifier, 
        password,
        loginMethod,
        clientType: 'mobile' as ClientType,
        rememberMe: true // Default to true for mobile
      };
      
      console.log('🔵 Mobile auth - Attempting login with:', { identifier, loginMethod });
      const result = await auth.login(credentials);
      console.log('🔵 Mobile auth - Login result:', result ? 'success' : 'failed');
      return result;
    } catch (error) {
      console.error('🔴 Mobile auth - Login failed:', error);
      throw error;
    }
  }, [auth]);

  // Enhanced biometric authentication
  const biometricLogin = useCallback(async () => {
    try {
      console.log('🔵 Mobile auth - Attempting biometric login');
      
      // Check if biometric authentication is available
      if (!biometricInfo?.available) {
        throw new Error('Biometric authentication not available');
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Zaloguj się używając biometrii',
        fallbackLabel: 'Użyj hasła',
        cancelLabel: 'Anuluj',
      });

      if (result.success) {
        console.log('🔵 Mobile auth - Biometric authentication successful, checking for stored session');
        
        // Try to refresh existing session
        try {
          auth.refreshToken(); // This is a mutation function, it doesn't return a value directly
          console.log('🔵 Mobile auth - Session refresh initiated');
          // For now, assume success and navigate - the shared auth hook will handle failures
          router.replace('/(tabs)');
          return true;
        } catch (refreshError) {
          console.warn('🔶 Mobile auth - Token refresh failed, user needs to login again');
        }
        
        // If refresh fails, redirect to login but show that biometric was successful
        Alert.alert(
          'Sesja wygasła',
          'Twoja sesja wygasła. Zaloguj się ponownie.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('🔴 Mobile auth - Biometric login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Błąd uwierzytelniania biometrycznego';
      Alert.alert('Błąd', errorMessage);
      return false;
    }
  }, [auth, biometricInfo, router]);

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

  // Enhanced logout with proper cleanup
  const logout = useCallback(async () => {
    try {
      console.log('🔵 Mobile auth - Starting logout process');
      await auth.logout();
      // Additional cleanup is handled in onLogoutSuccess callback
    } catch (error) {
      console.error('🔴 Mobile auth - Logout error:', error);
      // Even if logout fails, clear local storage and redirect
      try {
        await Promise.all([
          SecureStore.deleteItemAsync('accessToken'),
          SecureStore.deleteItemAsync('refreshToken'),
          SecureStore.deleteItemAsync('userIdentifier'),
        ]);
      } catch (storageError) {
        console.warn('Failed to clear secure storage during logout:', storageError);
      }
      router.replace('/login');
    }
  }, [auth, router]);

  return {
    // Core auth state and methods from shared hook
    ...auth,
    ...permissions,
    
    // Override methods for mobile compatibility
    login,
    logout,
    
    // Mobile-specific methods
    biometricLogin,
    checkBiometricAvailability,
    
    // Biometric availability info
    biometricInfo,
    canUseBiometrics: biometricInfo?.available || false,
    
    // Navigation helpers
    navigateToHome: () => router.replace('/(tabs)'),
    navigateToLogin: () => router.replace('/login'),
    navigateToProfile: () => router.push('/profile'),
    
    // Mobile-specific loading states
    isBiometricLoading: false, // Could be enhanced with state if needed
  };
}