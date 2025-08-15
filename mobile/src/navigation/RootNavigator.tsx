import React from 'react';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}