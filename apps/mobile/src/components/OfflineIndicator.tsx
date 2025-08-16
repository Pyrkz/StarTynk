import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSyncStatus } from '../lib/query/hooks';
import { syncQueue } from '../lib/sync/sync-queue';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  style?: any;
}

export function OfflineIndicator({ showDetails = false, style }: OfflineIndicatorProps) {
  const netInfo = useNetInfo();
  const { data: syncStatus } = useSyncStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  
  const isOnline = netInfo.isConnected;
  const pendingCount = syncStatus?.pendingCount || 0;
  const failedCount = syncStatus?.failedCount || 0;
  const isSyncing = syncQueue.isSyncInProgress();
  
  // Show indicator when offline or have pending/failed syncs
  const shouldShow = !isOnline || pendingCount > 0 || failedCount > 0;
  
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: shouldShow ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [shouldShow, slideAnim]);
  
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnim]);
  
  if (!shouldShow) return null;
  
  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B'; // Red for offline
    if (failedCount > 0) return '#FF8C00'; // Orange for failed syncs
    if (pendingCount > 0) return '#4A90E2'; // Blue for pending syncs
    return '#50C878'; // Green for all good
  };
  
  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline Mode - Changes will sync when connected';
    }
    if (isSyncing) {
      return `Syncing ${pendingCount} items...`;
    }
    if (failedCount > 0) {
      return `${failedCount} sync${failedCount > 1 ? 's' : ''} failed - Tap to retry`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} item${pendingCount > 1 ? 's' : ''} pending sync`;
    }
    return 'All synced';
  };
  
  const getDetailText = () => {
    const parts = [];
    if (pendingCount > 0) parts.push(`${pendingCount} pending`);
    if (failedCount > 0) parts.push(`${failedCount} failed`);
    if (isSyncing) parts.push('syncing...');
    
    const connectionType = netInfo.type && netInfo.type !== 'unknown' ? ` (${netInfo.type})` : '';
    const lastSync = syncStatus?.lastSyncAttempt ? 
      new Date(syncStatus.lastSyncAttempt).toLocaleTimeString() : 'Never';
    
    return `${parts.join(', ')}${connectionType} • Last sync: ${lastSync}`;
  };
  
  const handlePress = () => {
    if (failedCount > 0) {
      // Retry failed syncs
      syncQueue.retryAll();
    } else if (showDetails) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleForceSync = () => {
    if (isOnline) {
      syncQueue.forceSync();
    }
  };
  
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: slideAnim }],
          backgroundColor: getStatusColor(),
          zIndex: 1000,
          elevation: 1000,
        },
        style,
      ]}
    >
      <Pressable onPress={handlePress}>
        <View style={{ 
          padding: 12, 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {isSyncing && (
              <ActivityIndicator 
                size="small" 
                color="white" 
                style={{ marginRight: 8 }} 
              />
            )}
            <Text style={{ 
              color: 'white', 
              fontSize: 14, 
              fontWeight: '500',
              flex: 1,
            }}>
              {getStatusText()}
            </Text>
          </View>
          
          {showDetails && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isOnline && (
                <Pressable
                  onPress={handleForceSync}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    Sync Now
                  </Text>
                </Pressable>
              )}
              
              <Text style={{ color: 'white', fontSize: 18 }}>
                {isExpanded ? '−' : '+'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      
      {showDetails && (
        <Animated.View
          style={{
            maxHeight: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 100],
            }),
            opacity: expandAnim,
            overflow: 'hidden',
          }}
        >
          <View style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
          }}>
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: 12,
              marginTop: 8,
            }}>
              {getDetailText()}
            </Text>
            
            {failedCount > 0 && (
              <Pressable
                onPress={() => syncQueue.retryAll()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  marginTop: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                  Retry All Failed
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default OfflineIndicator;