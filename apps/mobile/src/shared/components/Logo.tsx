import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

export default function Logo({ size = 'medium', className }: LogoProps) {
  const fontSize = {
    small: 24,
    medium: 36,
    large: 48,
    xlarge: 64,
  }[size];

  // Oblicz szerokość "Star" - zwiększona dla pełnej widoczności
  const starWidth = fontSize * 2.0; // Zwiększona szerokość dla kompletnego słowa "Star"

  // Wspólna wysokość dla obu elementów
  const containerHeight = fontSize * 1.2;

  return (
    <View 
      className={`flex-row ${className || ''}`} 
      style={{ 
        alignItems: 'center',
        height: containerHeight,
      }}
    >
      <MaskedView
        style={{ 
          height: containerHeight, 
          width: starWidth,
        }}
        maskElement={
          <View style={{
            width: starWidth,
            height: containerHeight,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
            <Text
              style={{
                fontSize,
                fontWeight: 'bold',
                letterSpacing: -1,
                backgroundColor: 'transparent',
                textAlign: 'left',
                includeFontPadding: false,
              }}
            >
              Star
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={['#FEAD00', '#D75200']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, height: containerHeight }}
        />
      </MaskedView>
      <View
        style={{
          height: containerHeight,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: -8, // Zbliż słowa do siebie
        }}
      >
        <Text 
          style={{ 
            fontSize,
            fontWeight: 'bold',
            letterSpacing: -1,
            color: '#000000',
            lineHeight: fontSize * 1.2,
            includeFontPadding: false,
          }}
        >
          Tynk
        </Text>
      </View>
    </View>
  );
}