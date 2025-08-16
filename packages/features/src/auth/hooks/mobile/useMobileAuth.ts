import React from 'react';
import { useAuth as useBaseAuth } from '../useAuth';
import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Mobile-specific auth hook with offline support
 */
export function useMobileAuth() {
  const baseAuth = useBaseAuth();
  const netInfo = useNetInfo();

  // Sync network status
  React.useEffect(() => {
    if (netInfo.isConnected !== null) {
      baseAuth.setOnlineStatus(netInfo.isConnected);
    }
  }, [netInfo.isConnected]);

  return {
    ...baseAuth,
    // Mobile specific properties
    netInfo,
    isOffline: !netInfo.isConnected,
    canRefresh: netInfo.isConnected && baseAuth.isAuthenticated,
  };
}