import React from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFonts, Inter_800ExtraBold } from '@expo-google-fonts/inter';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
  const [fontsLoaded] = useFonts({
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const sizeClasses = {
    small: {
      text: 'text-2xl',
      width: 'w-[70px]',
      height: 'h-[29px]',
    },
    medium: {
      text: 'text-4xl',
      width: 'w-[105px]',
      height: 'h-[43px]',
    },
    large: {
      text: 'text-6xl',
      width: 'w-[175px]',
      height: 'h-[72px]',
    },
  };

  const isWeb = Platform.OS === 'web';
  const currentSize = sizeClasses[size];

  return (
    <View className={`flex-row items-center ${className}`}>
      {isWeb || !MaskedView ? (
        // Fallback for web and platforms without MaskedView support
        <Text
          className={`${currentSize.text} font-extrabold text-primary-500`}
          style={{
            fontFamily: 'Inter_800ExtraBold',
            // Web gradient text effect - nie da się tego zrobić w NativeWind
            backgroundImage: 'linear-gradient(90deg, #FEAD00 0%, #D75200 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as any}
        >
          Star
        </Text>
      ) : (
        // Native implementation with MaskedView
        <MaskedView
          maskElement={
            <Text
              className={`${currentSize.text} font-extrabold`}
              style={{ fontFamily: 'Inter_800ExtraBold' }}
            >
              Star
            </Text>
          }
          className={`${currentSize.height} ${currentSize.width}`}
        >
          <LinearGradient
            colors={['#FEAD00', '#D75200']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1"
          />
        </MaskedView>
      )}
      <Text
        className={`${currentSize.text} font-extrabold text-black`}
        style={{ fontFamily: 'Inter_800ExtraBold' }}
      >
        Tynk
      </Text>
    </View>
  );
}