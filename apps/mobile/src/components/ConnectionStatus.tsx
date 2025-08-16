import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

interface ConnectionStatusProps {
  style?: any;
  showConnectionType?: boolean;
}

export function ConnectionStatus({ style, showConnectionType = false }: ConnectionStatusProps) {
  const netInfo = useNetInfo();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    const isConnected = netInfo.isConnected;
    const wasConnected = netInfo.isConnected !== null;
    
    if (wasConnected) {
      if (isConnected) {
        setToastMessage('Back online');
        showTemporaryToast();
      } else {
        setToastMessage('Connection lost');
        showTemporaryToast();
      }
    }
  }, [netInfo.isConnected]);
  
  const showTemporaryToast = () => {
    setShowToast(true);
    
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };
  
  const getConnectionInfo = () => {
    const { isConnected, type, isInternetReachable } = netInfo;
    
    if (!isConnected) {
      return {
        status: 'Offline',
        details: 'No network connection',
        color: '#FF6B6B',
        icon: '⚡',
      };
    }
    
    if (isInternetReachable === false) {
      return {
        status: 'Limited',
        details: 'Connected but no internet',
        color: '#FF8C00',
        icon: '⚠️',
      };
    }
    
    const typeMap: Record<string, string> = {
      cellular: '📱',
      wifi: '📶',
      bluetooth: '🔗',
      ethernet: '🌐',
      wimax: '📡',
      vpn: '🔒',
      other: '🌐',
      unknown: '❓',
      none: '⚡',
    };
    
    return {
      status: 'Online',
      details: showConnectionType && type ? `Connected via ${type}` : 'Connected',
      color: '#50C878',
      icon: typeMap[type || 'unknown'] || '🌐',
    };
  };
  
  const connectionInfo = getConnectionInfo();
  
  return (
    <View style={style}>
      {/* Permanent status indicator */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: connectionInfo.color,
          borderRadius: 16,
        }}
      >
        <Text style={{ fontSize: 12, marginRight: 4 }}>
          {connectionInfo.icon}
        </Text>
        <Text
          style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '500',
          }}
        >
          {connectionInfo.status}
        </Text>
      </View>
      
      {/* Temporary toast notification */}
      {showToast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -40,
            left: 0,
            right: 0,
            opacity,
            transform: [{ translateY: -20 }],
          }}
        >
          <View
            style={{
              backgroundColor: connectionInfo.color,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              alignSelf: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
              }}
            >
              {toastMessage}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default ConnectionStatus;