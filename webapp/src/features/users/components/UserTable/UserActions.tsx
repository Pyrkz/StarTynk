import React from 'react'
import { UserWithRelations } from '@/features/users/types'
import { MoreVertical } from 'lucide-react'

interface UserActionsProps {
  user: UserWithRelations
  onEdit?: (user: UserWithRelations) => void
  onDelete?: (user: UserWithRelations) => void
}

export const UserActions: React.FC<UserActionsProps> = ({ user, onEdit }) => {
  return (
    <button
      type="button"
      className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors duration-150"
      onClick={() => onEdit?.(user)}
    >
      <MoreVertical className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Szczegóły użytkownika</span>
    </button>
  )
}