import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/features/auth';
import { setMobileStorage } from '@repo/features/auth/stores/auth.store.mobile';
import { mmkvStorageAdapter } from '@/core/storage/mmkv-storage';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize mobile storage for auth store
        console.log('🔧 Initializing mobile storage...');
        setMobileStorage(mmkvStorageAdapter);
        setIsStorageInitialized(true);
        
        // Hide splash screen after initialization
        await SplashScreen.hideAsync();
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Still hide splash screen and mark as initialized to prevent blocking
        await SplashScreen.hideAsync();
        setIsStorageInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Don't render anything until storage is initialized
  if (!isStorageInitialized) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#FEAD00',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Logowanie',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="test" 
          options={{ 
            title: 'Test' 
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}