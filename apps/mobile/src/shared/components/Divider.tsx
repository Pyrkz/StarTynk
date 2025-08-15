import React from 'react';
import { View } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'light' | 'default' | 'strong';
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  thickness = 'thin',
  color = 'default',
  className = '',
}: DividerProps) {
  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full',
  };

  const thicknessClasses = {
    thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
    medium: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    thick: orientation === 'horizontal' ? 'h-1' : 'w-1',
  };

  const colorClasses = {
    light: 'bg-border-light',
    default: 'bg-border',
    strong: 'bg-border-strong',
  };

  return (
    <View
      className={`${orientationClasses[orientation]} ${thicknessClasses[thickness]} ${colorClasses[color]} ${className}`}
    />
  );
}