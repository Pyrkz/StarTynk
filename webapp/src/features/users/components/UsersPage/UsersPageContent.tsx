import React from 'react'
import { UserTable, UserFilters } from '@/features/users/components'
import { UserWithRelations } from '@/features/users/types'
import { UsersSkeleton } from './UsersSkeleton'

interface UsersPageContentProps {
  users: UserWithRelations[]
  loading: boolean
  filters: any
  onFiltersChange: (filters: any) => void
  onEdit: (user: UserWithRelations) => void
  onDelete: (user: UserWithRelations) => void
}

const UsersPageContent: React.FC<UsersPageContentProps> = ({
  users,
  loading,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-neutral-200">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Filtrowanie</h2>
          <div className="mt-3 sm:mt-4">
            <UserFilters filters={filters} onChange={onFiltersChange} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-200">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Lista użytkowników</h2>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-neutral-600">
            {loading ? 'Ładowanie...' : `Znaleziono ${users.length} użytkowników`}
          </p>
        </div>
        <div>
          {loading ? (
            <UsersSkeleton />
          ) : (
            <UserTable
              users={users}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default UsersPageContent