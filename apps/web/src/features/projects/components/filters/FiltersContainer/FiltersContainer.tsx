import React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '../SearchBar'
import { StatusFilter } from '../StatusFilter'
import { cn } from '@/lib/utils'
import { ProjectStatus } from '@/features/projekty/types'

interface FiltersContainerProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusValue: ProjectStatus | 'ALL'
  onStatusChange: (status: ProjectStatus | 'ALL') => void
  statusOptions: Array<{ value: ProjectStatus | 'ALL'; label: string; color?: string }>
  onFilter?: () => void
  isLoading?: boolean
  className?: string
}

export const FiltersContainer: React.FC<FiltersContainerProps> = ({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  statusOptions,
  onFilter,
  isLoading = false,
  className
}) => {
  return (
    <div className={cn(
      'bg-white rounded-xl shadow-elevation-low p-4 lg:p-5',
      'border border-neutral-100',
      className
    )}>
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          onFilter?.()
        }}
        className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center"
      >
        {/* Search Bar */}
        <div className="flex-1 md:flex-[2]">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onSubmit={onFilter}
            placeholder="Szukaj po nazwie, adresie lub opisie..."
            isLoading={isLoading}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-44">
          <StatusFilter
            value={statusValue}
            onChange={onStatusChange}
            options={statusOptions}
          />
        </div>

        {/* Filter Button */}
        {onFilter && (
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            className="shadow-elevation-low hover:shadow-elevation-medium"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtruj
          </Button>
        )}
      </form>
    </div>
  )
}