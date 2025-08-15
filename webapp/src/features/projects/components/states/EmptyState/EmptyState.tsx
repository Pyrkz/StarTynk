import React from 'react'
import { Plus, Search, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  hasFilters?: boolean
  onAddProject?: () => void
  onClearFilters?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters = false,
  onAddProject,
  onClearFilters,
  className
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-elevation-low p-12',
      'flex flex-col items-center justify-center text-center',
      className
    )}>
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        {hasFilters ? (
          <Search className="w-8 h-8 text-neutral-400" />
        ) : (
          <FolderOpen className="w-8 h-8 text-neutral-400" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {hasFilters ? 'Brak wyników' : 'Brak projektów'}
      </h3>
      
      <p className="text-sm text-neutral-600 mb-6 max-w-md">
        {hasFilters
          ? 'Nie znaleziono projektów spełniających kryteria wyszukiwania. Spróbuj zmienić filtry lub wyszukiwane frazy.'
          : 'Nie masz jeszcze żadnych projektów. Dodaj pierwszy projekt, aby rozpocząć.'}
      </p>

      <div className="flex gap-3">
        {hasFilters && onClearFilters && (
          <Button
            variant="outline"
            size="md"
            onClick={onClearFilters}
          >
            Wyczyść filtry
          </Button>
        )}
        
        {onAddProject && (
          <Button
            variant="primary"
            size="md"
            onClick={onAddProject}
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pierwszy projekt
          </Button>
        )}
      </div>
    </div>
  )
}