import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, checkAuthStatus, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  
  console.log('🔵 SplashScreen loaded! Auth state:', { isAuthenticated, isLoading });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔵 SplashScreen - Checking authentication status...');
        
        // Check authentication status
        await checkAuthStatus();
        
        // Give a moment for the auth state to settle
        setTimeout(() => {
          setIsInitializing(false);
        }, 500);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [checkAuthStatus]);

  useEffect(() => {
    // Navigate when initialization is complete and we have auth state
    if (!isInitializing && !isLoading) {
      console.log('🔵 SplashScreen - Navigation decision. Authenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('🔵 User is authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('🔵 User is not authenticated, navigating to login');
        router.replace('/login');
      }
    }
  }, [isInitializing, isLoading, isAuthenticated, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
      <Text style={{ color: '#FEAD00', fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
        StarTynk
      </Text>
      <ActivityIndicator size="large" color="#FEAD00" />
      <Text style={{ color: '#FEAD00', fontSize: 14, marginTop: 20, opacity: 0.8 }}>
        {isInitializing ? 'Initializing...' : isLoading ? 'Checking authentication...' : 'Redirecting...'}
      </Text>
    </View>
  );
}