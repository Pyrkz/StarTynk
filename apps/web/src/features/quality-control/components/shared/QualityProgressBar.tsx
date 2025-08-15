'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface QualityProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'striped'
  colorScheme?: 'auto' | 'green' | 'blue' | 'amber' | 'red'
  animated?: boolean
  className?: string
}

export const QualityProgressBar: React.FC<QualityProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
  colorScheme = 'auto',
  animated = true,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  const getColorClass = () => {
    if (colorScheme === 'auto') {
      if (percentage >= 90) return 'bg-emerald-500'
      if (percentage >= 75) return 'bg-blue-500'
      if (percentage >= 60) return 'bg-amber-500'
      return 'bg-red-500'
    }

    const colors = {
      green: 'bg-emerald-500',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500'
    }

    return colors[colorScheme]
  }

  const getBackgroundPattern = () => {
    if (variant === 'striped') {
      return 'bg-stripes'
    }
    if (variant === 'gradient') {
      if (colorScheme === 'auto') {
        if (percentage >= 90) return 'bg-gradient-to-r from-emerald-400 to-emerald-600'
        if (percentage >= 75) return 'bg-gradient-to-r from-blue-400 to-blue-600'
        if (percentage >= 60) return 'bg-gradient-to-r from-amber-400 to-amber-600'
        return 'bg-gradient-to-r from-red-400 to-red-600'
      }
      const gradients = {
        green: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
        amber: 'bg-gradient-to-r from-amber-400 to-amber-600',
        red: 'bg-gradient-to-r from-red-400 to-red-600'
      }
      return gradients[colorScheme]
    }
    return getColorClass()
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getBackgroundPattern(),
            animated && 'animate-progress-fill',
            variant === 'striped' && animated && 'animate-stripes'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// Add these styles to your global CSS
const progressStyles = `
  @keyframes progress-fill {
    from {
      width: 0;
    }
  }

  @keyframes stripes {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 2rem 0;
    }
  }

  .animate-progress-fill {
    animation: progress-fill 1s ease-out;
  }

  .animate-stripes {
    animation: stripes 1s linear infinite;
  }

  .bg-stripes {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
  }
`