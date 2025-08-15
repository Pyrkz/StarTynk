import React from 'react'
import { UserWithRelations } from '@/features/users/types'
import { formatDate } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import { UserActions } from './UserActions'

interface UserTableMobileProps {
  users: UserWithRelations[]
  onEdit?: (user: UserWithRelations) => void
  onDelete?: (user: UserWithRelations) => void
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  MODERATOR: 'Moderator',
  COORDINATOR: 'Koordynator',
  WORKER: 'Pracownik',
  USER: 'Użytkownik',
}

const roleBadgeClasses: Record<string, string> = {
  ADMIN: 'badge-error',
  MODERATOR: 'badge-blue',
  COORDINATOR: 'badge-success',
  WORKER: 'badge-warning',
  USER: 'badge-neutral',
}

export const UserTableMobile: React.FC<UserTableMobileProps> = ({
  users,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <UserAvatar user={user} size="md" />
              <div className="ml-3">
                <div className="text-sm font-medium text-neutral-900">
                  {user.name || 'Brak nazwy'}
                </div>
                <div className="text-sm text-neutral-600">{user.email}</div>
                {user.position && (
                  <div className="text-xs text-neutral-500 mt-0.5">{user.position}</div>
                )}
              </div>
            </div>
            <UserActions
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          {(user.phone || user.department) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {user.phone && (
                <div>
                  <span className="text-neutral-500">Telefon:</span>
                  <div className="text-neutral-900">{user.phone}</div>
                </div>
              )}
              {user.department && (
                <div>
                  <span className="text-neutral-500">Dział:</span>
                  <div className="text-neutral-900">{user.department}</div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClasses[user.role] || 'badge-neutral'}`}>
                {roleLabels[user.role] || user.role}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                {user.isActive ? 'Aktywny' : 'Nieaktywny'}
              </span>
            </div>
            {user.lastLoginAt && (
              <div className="text-xs text-neutral-500">
                Ostatnie logowanie: {formatDate(user.lastLoginAt)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}