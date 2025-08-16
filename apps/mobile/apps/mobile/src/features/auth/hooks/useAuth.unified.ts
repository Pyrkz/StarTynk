/**
 * Example migration: Mobile auth hook using unified state management
 * This shows how to migrate from the current auth implementation to the unified one
 */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useMobileAuth, useAuthForm } from '@repo/features';
import type { LoginRequest } from '@repo/shared/types';

export function useAuth() {
  const router = useRouter();
  const auth = useMobileAuth();
  const authForm = useAuthForm();
  
  // Mobile-specific login that uses the unified auth
  const login = useCallback(async (identifier: string, password: string, loginMethod: 'email' | 'phone' = 'email') => {
    const request: LoginRequest = { 
      identifier, 
      password, 
      loginMethod,
      rememberMe: true 
    };
    
    const response = await auth.login(request);
    
    if (response.success) {
      // Store credentials for biometric login
      await SecureStore.setItemAsync('userIdentifier', identifier);
      router.replace('/(tabs)');
    }
    
    return response;
  }, [auth, router]);

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
        // If successful, refresh the token
        const refreshResponse = await auth.refreshToken();
        
        if (refreshResponse.success) {
          router.replace('/(tabs)');
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Biometric login failed:', error);
      return false;
    }
  }, [auth, router]);

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

  const logout = useCallback(async () => {
    await auth.logout();
    router.replace('/login');
  }, [auth, router]);

  return {
    // All unified auth properties
    ...auth,
    
    // Form handling
    ...authForm,
    
    // Override specific methods for mobile compatibility
    login,
    logout,
    
    // Add mobile-specific methods
    biometricLogin,
    checkBiometricAvailability,
    
    // Navigation helpers
    navigateToHome: () => router.replace('/(tabs)'),
    navigateToLogin: () => router.replace('/login'),
    navigateToProfile: () => router.push('/profile'),
  };
}