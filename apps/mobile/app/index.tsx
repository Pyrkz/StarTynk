import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth';
import { Logo } from '@/src/shared/components';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <View className="flex-1 justify-center items-center bg-app-background">
      <Logo size="large" className="mb-8" />
      <ActivityIndicator size="large" color="#FEAD00" />
    </View>
  );
}