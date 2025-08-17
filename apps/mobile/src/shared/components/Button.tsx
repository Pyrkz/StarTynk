import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  className = '',
  textClassName = '',
  icon,
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-2xl';
  
  const variantClasses = {
    primary: `bg-primary-500 ${!disabled && 'active:bg-primary-600'}`,
    secondary: `bg-secondary-500 ${!disabled && 'active:bg-secondary-600'}`,
    outline: `border-2 border-primary-500 ${!disabled && 'active:bg-primary-50'}`,
    ghost: `${!disabled && 'active:bg-neutral-100'}`,
  };

  const sizeClasses = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    ghost: 'text-foreground',
  };

  const disabledClasses = disabled ? 'opacity-50' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? 'white' : '#FEAD00'}
        />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`font-semibold ${textSizeClasses[size]} ${textColorClasses[variant]} ${textClassName}`}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}