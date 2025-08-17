import React, { useEffect } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import Logo from '../../../shared/components/Logo';

export default function LoadingScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-app-background justify-center items-center">
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Logo size="large" />
      </Animated.View>
      
      <View className="absolute bottom-20">
        <ActivityIndicator size="large" color="#FEAD00" />
      </View>
    </View>
  );
}