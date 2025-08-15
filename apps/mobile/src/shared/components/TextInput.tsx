import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, TextInputProps as RNTextInputProps } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function TextInput({
  label,
  error,
  containerClassName = '',
  inputClassName = '',
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`${containerClassName}`}>
      {label && (
        <Text className="text-text-secondary text-sm mb-1">{label}</Text>
      )}
      <RNTextInput
        className={`
          bg-white 
          border 
          ${isFocused ? 'border-primary-500' : error ? 'border-error-500' : 'border-border-light'}
          rounded-2xl 
          px-4 
          py-3
          text-foreground
          text-base
          ${inputClassName}
        `}
        placeholderTextColor="#A3A3A3"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <Text className="text-error-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}