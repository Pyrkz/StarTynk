import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo, Button, TextInput, Checkbox } from '@/shared/components';
import { validateLoginForm } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import type { LoginFormData } from '../types';
import { LoginMethod } from '@repo/shared/types';

export function LoginScreen() {
  const { 
    login, 
    biometricLogin, 
    canUseBiometrics, 
    biometricInfo,
    isLoading 
  } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    loginMethod: 'phone',
    phoneNumber: '',
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormLoading, setIsFormLoading] = useState(false);

  // TODO: Implement remember me functionality with SecureStore
  // useEffect(() => {
  //   const loadRememberedCredentials = async () => {
  //     // Load from SecureStore
  //   };
  //   loadRememberedCredentials();
  // }, []);

  const handleInputChange = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleLogin = useCallback(async () => {
    // Validate form
    const validation = validateLoginForm(
      formData.loginMethod as 'email' | 'phone',
      formData.phoneNumber,
      formData.email,
      formData.password
    );
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsFormLoading(true);
    try {
      const identifier = formData.loginMethod === 'phone' ? formData.phoneNumber : formData.email;
      await login(identifier, formData.password, formData.loginMethod as LoginMethod);
      
      // Navigation will be handled by the auth state change
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nie udało się zalogować. Spróbuj ponownie.';
      Alert.alert('Błąd', errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  }, [formData, login]);

  const handleRegister = useCallback(() => {
    // TODO: Implement register screen
    Alert.alert('Info', 'Rejestracja będzie dostępna wkrótce');
  }, []);

  const handleForgotPassword = useCallback(() => {
    // TODO: Implement forgot password screen
    Alert.alert('Info', 'Resetowanie hasła będzie dostępne wkrótce');
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    try {
      await biometricLogin();
    } catch (error) {
      console.error('Biometric login failed:', error);
    }
  }, [biometricLogin]);

  const isAnyLoading = isLoading || isFormLoading;

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 justify-center">
            {/* Logo */}
            <View className="items-center mb-6">
              <Logo size="large" />
            </View>

            {/* Welcome text */}
            <Text className="text-center text-text-secondary text-base mb-8">
              Witaj z powrotem! Proszę wprowadź swoje dane.
            </Text>

            {/* Login method toggle */}
            <View className="flex-row bg-neutral-100 rounded-lg p-1 mb-6">
              <Pressable
                className={`flex-1 py-3 rounded-md ${
                  formData.loginMethod === 'phone' ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => handleInputChange('loginMethod', 'phone')}
              >
                <Text
                  className={`text-center font-medium ${
                    formData.loginMethod === 'phone' ? 'text-foreground' : 'text-text-secondary'
                  }`}
                >
                  Numer telefonu
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-3 rounded-md ${
                  formData.loginMethod === 'email' ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => handleInputChange('loginMethod', 'email')}
              >
                <Text
                  className={`text-center font-medium ${
                    formData.loginMethod === 'email' ? 'text-foreground' : 'text-text-secondary'
                  }`}
                >
                  Email
                </Text>
              </Pressable>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Phone number or Email input */}
              {formData.loginMethod === 'phone' ? (
                <TextInput
                  placeholder="Numer telefonu"
                  value={formData.phoneNumber}
                  onChangeText={(value: string) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  error={errors.phoneNumber}
                  containerClassName="mb-4"
                  maxLength={9}
                />
              ) : (
                <TextInput
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(value: string) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  containerClassName="mb-4"
                />
              )}

              {/* Password input */}
              <TextInput
                placeholder="Hasło"
                value={formData.password}
                onChangeText={(value: string) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
                containerClassName="mb-4"
              />

              {/* Remember me and Forgot password row */}
              <View className="flex-row justify-between items-center mb-6">
                <Checkbox
                  checked={formData.rememberMe}
                  onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
                  label="Zapamiętaj mnie"
                />
                <Pressable onPress={handleForgotPassword}>
                  <Text className="text-foreground text-base">
                    Nie pamiętasz hasła?
                  </Text>
                </Pressable>
              </View>

              {/* Login button */}
              <Button
                title="Zaloguj się"
                onPress={handleLogin}
                variant="primary"
                size="large"
                loading={isAnyLoading}
                disabled={isAnyLoading}
                className="mb-4"
              />

              {/* Biometric login button */}
              {canUseBiometrics && (
                <Pressable
                  onPress={handleBiometricLogin}
                  disabled={isAnyLoading}
                  className={`flex-row items-center justify-center bg-transparent border border-foreground rounded-lg py-3 px-4 mb-4 ${
                    isAnyLoading ? 'opacity-50' : ''
                  }`}
                >
                  <Ionicons 
                    name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print'} 
                    size={20} 
                    color="#FEAD00" 
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-foreground text-base font-semibold">
                    Zaloguj się biometrycznie
                  </Text>
                </Pressable>
              )}

              {/* Or divider */}
              <Text className="text-center text-text-tertiary text-base my-4">
                Lub
              </Text>

              {/* Register section */}
              <View className="flex-row justify-center items-center">
                <Text className="text-text-secondary text-base">
                  Nie posiadasz konta?{' '}
                </Text>
                <Pressable onPress={handleRegister} disabled={isAnyLoading}>
                  <Text className="text-foreground text-base font-semibold">
                    Zarejestruj się
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}