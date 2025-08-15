import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'elevated',
  padding = 'medium',
  children,
  className = '',
  ...props
}: CardProps) {
  const variantClasses = {
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border border-light',
    filled: 'bg-surface-secondary',
  };

  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <View
      className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}