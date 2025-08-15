'use client'

import React from 'react'
import { UserFilters as UserFiltersType } from '@/features/users/types'
import { Role } from '@repo/database'
import { SearchInput } from './SearchInput'
import { FilterSelect } from './FilterSelect'
import { SortSelect } from './SortSelect'
import { Filter } from 'lucide-react'

interface UserFiltersProps {
  filters: UserFiltersType
  onChange: (filters: UserFiltersType) => void
  loading?: boolean
}

const roleOptions: { value: Role | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Wszystkie role' },
  { value: 'USER', label: 'Użytkownik' },
  { value: 'WORKER', label: 'Pracownik' },
  { value: 'COORDINATOR', label: 'Koordynator' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Administrator' },
]

const statusOptions: { value: boolean | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Wszystkie statusy' },
  { value: true, label: 'Aktywni' },
  { value: false, label: 'Nieaktywni' },
]

const sortOptions: { value: UserFiltersType['sortBy']; label: string }[] = [
  { value: 'createdAt', label: 'Data utworzenia' },
  { value: 'name', label: 'Nazwa' },
  { value: 'email', label: 'Email' },
  { value: 'lastLoginAt', label: 'Ostatnie logowanie' },
  { value: 'role', label: 'Rola' },
]

export const UserFilters: React.FC<UserFiltersProps> = ({ filters, onChange, loading = false }) => {
  const handleChange = (key: keyof UserFiltersType, value: UserFiltersType[keyof UserFiltersType]) => {
    onChange({
      ...filters,
      [key]: value,
      page: 1, // Reset page when filters change
    })
  }

  const activeFiltersCount = [
    filters.search,
    filters.role && filters.role !== 'ALL',
    filters.isActive !== 'ALL',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Header with filter count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-neutral-600">
          <Filter className="h-4 w-4" />
          <span>Filtry</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {activeFiltersCount} aktywne
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              onChange({
                ...filters,
                search: undefined,
                role: undefined,
                isActive: 'ALL',
                page: 1,
              })
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150"
            disabled={loading}
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Filters grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="sm:col-span-2 lg:col-span-5">
          <SearchInput
            value={filters.search || ''}
            onChange={(value) => handleChange('search', value)}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-2">
          <FilterSelect
            id="role"
            label="Rola"
            value={filters.role || 'ALL'}
            onChange={(value) => handleChange('role', value)}
            options={roleOptions}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-2">
          <FilterSelect
            id="status"
            label="Status"
            value={filters.isActive === 'ALL' ? 'ALL' : String(filters.isActive)}
            onChange={(value) => {
              handleChange('isActive', value === 'ALL' ? 'ALL' : value === 'true')
            }}
            options={statusOptions.map(opt => ({ ...opt, value: String(opt.value) }))}
            loading={loading}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <SortSelect
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortByChange={(value) => handleChange('sortBy', value)}
            onSortOrderChange={(value) => handleChange('sortOrder', value)}
            options={sortOptions}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}