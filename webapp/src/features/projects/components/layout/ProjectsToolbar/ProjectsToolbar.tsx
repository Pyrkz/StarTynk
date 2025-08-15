import React from 'react'
import { LayoutGrid, List, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ProjectsToolbarProps } from './ProjectsToolbar.types'

export const ProjectsToolbar: React.FC<ProjectsToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading = false,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            viewMode === 'grid'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
          title="Widok kafelkowy"
          aria-label="Widok kafelkowy"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            viewMode === 'list'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
          title="Widok listy"
          aria-label="Widok listy"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="ml-auto"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          <span className="sr-only">Odśwież</span>
        </Button>
      )}
    </div>
  )
}