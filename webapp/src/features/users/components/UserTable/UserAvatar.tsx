import React from 'react'
import { UserWithRelations } from '@/features/users/types'

interface UserAvatarProps {
  user: UserWithRelations
  size?: 'sm' | 'md' | 'lg'
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const getInitials = () => {
    if (user.name) {
      const names = user.name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return user.name[0].toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const getBackgroundColor = () => {
    const colors = [
      'bg-neutral-400',
      'bg-neutral-500',
      'bg-neutral-600',
      'bg-neutral-700',
    ]
    const index = user.email.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className={`${sizeClasses[size]} ${getBackgroundColor()} rounded-full flex items-center justify-center text-white font-medium`}>
      {getInitials()}
    </div>
  )
}