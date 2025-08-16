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
import { useRouter } from 'expo-router';
import { Logo, Button, TextInput, Checkbox } from '@/src/shared/components';
import { validateLoginForm } from '../utils/validation';
import { authService } from '@repo/auth';
import { useAuth } from '../context';
import type { LoginFormData, LoginMethod } from '../types';

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    loginMethod: 'phone',
    phoneNumber: '',
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check for remembered credentials on mount
  useEffect(() => {
    const loadRememberedCredentials = async () => {
      const remembered = await authService.getRememberedCredentials();
      if (remembered) {
        setFormData(prev => ({
          ...prev,
          loginMethod: remembered.loginMethod,
          [remembered.loginMethod === 'phone' ? 'phoneNumber' : 'email']: remembered.identifier,
          rememberMe: true,
        }));
      }
    };
    loadRememberedCredentials();
  }, []);

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
      formData.loginMethod,
      formData.phoneNumber,
      formData.email,
      formData.password
    );
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
      
      // Navigation will be handled by the auth state change in index.tsx
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Nie udało się zalogować. Spróbuj ponownie.';
      Alert.alert('Błąd', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, router]);

  const handleRegister = useCallback(() => {
    // TODO: Implement register screen
    Alert.alert('Info', 'Rejestracja będzie dostępna wkrótce');
  }, []);

  const handleForgotPassword = useCallback(() => {
    // TODO: Implement forgot password screen
    Alert.alert('Info', 'Resetowanie hasła będzie dostępne wkrótce');
  }, []);

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
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
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
                  onChangeText={(value) => handleInputChange('email', value)}
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
                onChangeText={(value) => handleInputChange('password', value)}
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
                loading={isLoading}
                disabled={isLoading}
                className="mb-4"
              />

              {/* Or divider */}
              <Text className="text-center text-text-tertiary text-base my-4">
                Lub
              </Text>

              {/* Register section */}
              <View className="flex-row justify-center items-center">
                <Text className="text-text-secondary text-base">
                  Nie posiadasz konta?{' '}
                </Text>
                <Pressable onPress={handleRegister} disabled={isLoading}>
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