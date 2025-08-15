import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual variant of the badge
   */
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  /**
   * Size of the badge
   */
  size?: 'xs' | 'sm' | 'md'
  /**
   * Whether to show a pulse animation (useful for new notifications)
   */
  pulse?: boolean
  /**
   * Content to display in the badge (typically a number)
   */
  children: React.ReactNode
  /**
   * Maximum number to display before showing "+" (e.g., "99+")
   */
  max?: number
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'sm',
  pulse = false,
  children,
  max = 99,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-colors'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-600 text-white',
    neutral: 'bg-neutral-600 text-white',
    outline: 'border border-gray-300 text-gray-700 bg-white'
  }
  
  const sizeClasses = {
    xs: 'min-w-[1rem] h-4 px-1 text-xs',
    sm: 'min-w-[1.25rem] h-5 px-1.5 text-xs',
    md: 'min-w-[1.5rem] h-6 px-2 text-sm'
  }

  // Format the content if it's a number
  const formatContent = () => {
    if (typeof children === 'number' && max && children > max) {
      return `${max}+`
    }
    return children
  }

  return (
    <span className="relative inline-flex">
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            variantClasses[variant]
          )}
        />
      )}
      <span
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          pulse && 'relative',
          className
        )}
        {...props}
      >
        {formatContent()}
      </span>
    </span>
  )
}

export { Badge }