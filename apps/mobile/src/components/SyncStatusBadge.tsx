import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSyncStatus } from '../lib/query/hooks';

interface SyncStatusBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function SyncStatusBadge({ size = 'medium', style }: SyncStatusBadgeProps) {
  const netInfo = useNetInfo();
  const { data: syncStatus } = useSyncStatus();
  
  const isOnline = netInfo.isConnected;
  const pendingCount = syncStatus?.pendingCount || 0;
  const failedCount = syncStatus?.failedCount || 0;
  
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { 
          containerSize: 16, 
          iconSize: 8, 
          fontSize: 8, 
          borderWidth: 1 
        };
      case 'large':
        return { 
          containerSize: 32, 
          iconSize: 16, 
          fontSize: 12, 
          borderWidth: 3 
        };
      default:
        return { 
          containerSize: 24, 
          iconSize: 12, 
          fontSize: 10, 
          borderWidth: 2 
        };
    }
  };
  
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        color: '#FF6B6B',
        label: 'Offline',
        showCount: false,
      };
    }
    
    if (failedCount > 0) {
      return {
        color: '#FF8C00',
        label: 'Failed',
        showCount: true,
        count: failedCount,
      };
    }
    
    if (pendingCount > 0) {
      return {
        color: '#4A90E2',
        label: 'Pending',
        showCount: true,
        count: pendingCount,
      };
    }
    
    return {
      color: '#50C878',
      label: 'Synced',
      showCount: false,
    };
  };
  
  const sizeConfig = getSizeConfig();
  const statusConfig = getStatusConfig();
  
  return (
    <View
      style={[
        {
          width: sizeConfig.containerSize,
          height: sizeConfig.containerSize,
          borderRadius: sizeConfig.containerSize / 2,
          backgroundColor: statusConfig.color,
          borderWidth: sizeConfig.borderWidth,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        style,
      ]}
    >
      {pendingCount > 0 && isOnline ? (
        <ActivityIndicator 
          size={sizeConfig.iconSize} 
          color="white" 
        />
      ) : (
        <View
          style={{
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
            borderRadius: sizeConfig.iconSize / 2,
            backgroundColor: 'white',
          }}
        />
      )}
      
      {statusConfig.showCount && statusConfig.count && statusConfig.count > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#FF4444',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'white',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: sizeConfig.fontSize,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {statusConfig.count > 99 ? '99+' : statusConfig.count}
          </Text>
        </View>
      )}
    </View>
  );
}

export default SyncStatusBadge;