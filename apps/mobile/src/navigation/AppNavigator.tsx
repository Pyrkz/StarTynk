import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useAppStore } from '../store/useAppStore';
import { useAppInitialization } from '../features/loading/hooks/useAppInitialization';
import LoadingScreen from '../features/loading/screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OrderNavigator from './OrderNavigator';
import OrderHistoryScreen from '../features/orders/screens/OrderHistoryScreen';
import OrderDetailScreen from '../features/orders/screens/OrderDetailScreen';
import WorkDetailScreen from '../features/work/screens/WorkDetailScreen';
import WorkArchiveScreen from '../features/work/screens/WorkArchiveScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAppStore();
  const { isInitialized } = useAppInitialization();

  console.log('AppNavigator - isAuthenticated:', isAuthenticated);
  console.log('AppNavigator - user:', user);
  console.log('AppNavigator - isInitialized:', isInitialized);

  // Pokaż LoadingScreen podczas inicjalizacji
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="Order" component={OrderNavigator} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="WorkDetail" component={WorkDetailScreen} />
            <Stack.Screen name="WorkArchive" component={WorkArchiveScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}