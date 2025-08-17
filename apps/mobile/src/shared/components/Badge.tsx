import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  text?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'small' | 'medium';
  className?: string;
}

export function Badge({
  text,
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100',
    secondary: 'bg-secondary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    error: 'bg-error-100',
    neutral: 'bg-neutral-100',
  };

  const textColorClasses = {
    primary: 'text-primary-700',
    secondary: 'text-secondary-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-700',
    neutral: 'text-neutral-700',
  };

  const sizeClasses = {
    small: 'px-2 py-0.5',
    medium: 'px-3 py-1',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
  };

  return (
    <View
      className={`rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Text
        className={`font-medium ${textSizeClasses[size]} ${textColorClasses[variant]}`}
      >
        {children || text}
      </Text>
    </View>
  );
}