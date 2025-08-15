import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onPress, label, className = '' }: CheckboxProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center ${className}`}
    >
      <View
        className={`
          w-5 h-5 rounded 
          ${checked ? 'bg-foreground' : 'bg-white border-2 border-neutral-400'}
          items-center justify-center mr-2
        `}
      >
        {checked && (
          <Ionicons name="checkmark" size={14} color="white" />
        )}
      </View>
      {label && (
        <Text className="text-foreground text-base">{label}</Text>
      )}
    </Pressable>
  );
}