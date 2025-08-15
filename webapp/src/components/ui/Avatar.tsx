import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * URL of the avatar image
   */
  src?: string
  /**
   * Alt text for the image (required for accessibility)
   */
  alt: string
  /**
   * Fallback text to display when image is not available (typically initials)
   */
  fallback?: string
  /**
   * Size variant of the avatar
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Shape of the avatar
   */
  shape?: 'circle' | 'square'
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  shape = 'circle',
  className,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg'
  }

  const baseClasses = 'relative inline-flex items-center justify-center overflow-hidden bg-neutral-200 text-neutral-600 font-medium select-none flex-shrink-0'

  const handleImageError = () => {
    setImageError(true)
  }

  const renderFallback = () => {
    if (fallback) {
      return (
        <span className="uppercase">
          {fallback.slice(0, 2)}
        </span>
      )
    }
    // Default fallback to first two letters of alt text
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return <span>{initials || '?'}</span>
  }

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      ) : (
        renderFallback()
      )}
    </div>
  )
}

export { Avatar }