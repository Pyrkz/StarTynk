'use client'

import React from 'react'
import { UserWithRelations } from '@/features/users/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import { UserActions } from './UserActions'
import { UserTableMobile } from './UserTableMobile'
import { Users } from 'lucide-react'

interface UserTableProps {
  users: UserWithRelations[]
  onEdit?: (user: UserWithRelations) => void
  onDelete?: (user: UserWithRelations) => void
  loading?: boolean
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

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return null
  }

  if (users.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-12 h-12 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">Brak użytkowników</h3>
        <p className="text-neutral-600">Nie znaleziono użytkowników spełniających kryteria wyszukiwania.</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden">
        <UserTableMobile
          users={users}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className="bg-neutral-50">
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
            Użytkownik
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
            Kontakt
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
            Rola
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
            Ostatnia aktywność
          </th>
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Akcje</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-neutral-200">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-neutral-50 transition-colors duration-150">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <UserAvatar user={user} />
                <div className="ml-4">
                  <div className="text-sm font-medium text-neutral-900">
                    {user.name || 'Brak nazwy'}
                  </div>
                  <div className="text-sm text-neutral-600">{user.email}</div>
                  {user.position && (
                    <div className="text-xs text-neutral-500 mt-0.5">{user.position}</div>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-neutral-900">
                {user.phone || '—'}
              </div>
              {user.department && (
                <div className="text-sm text-neutral-600">{user.department}</div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClasses[user.role] || 'badge-neutral'}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                {user.isActive ? 'Aktywny' : 'Nieaktywny'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {user.lastLoginAt ? (
                <div>
                  <div className="text-sm text-neutral-900">{formatDate(user.lastLoginAt)}</div>
                  <div className="text-xs text-neutral-600">
                    {formatDateTime(user.lastLoginAt)}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-neutral-500">Nigdy</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <UserActions
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </div>
    </>
  )
}