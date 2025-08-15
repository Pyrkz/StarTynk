import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      await login({ email, password });
      Alert.alert('Success', 'Login successful!');
      // Navigate to home screen
    } catch (err) {
      Alert.alert('Error', error || 'Login failed');
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-app-background">
      <View className="bg-white p-6 rounded-lg shadow-lg">
        <Text className="text-2xl font-bold text-center mb-6 text-neutral-900">
          Login
        </Text>

        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 mb-4"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 mb-6"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className={`bg-primary-500 rounded-lg py-3 ${loading ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Login
            </Text>
          )}
        </TouchableOpacity>

        {error && (
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        )}
      </View>
    </View>
  );
}