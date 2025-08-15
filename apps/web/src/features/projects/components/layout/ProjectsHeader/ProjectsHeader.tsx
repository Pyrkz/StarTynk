import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ProjectsHeaderProps } from './ProjectsHeader.types'

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  title,
  totalCount,
  onAddProject,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          {title}
        </h1>
        {totalCount !== undefined && (
          <p className="text-sm text-neutral-600 mt-1">
            {totalCount} {totalCount === 1 ? 'projekt' : totalCount < 5 ? 'projekty' : 'projektów'}
          </p>
        )}
      </div>
      
      {onAddProject && (
        <Button
          variant="primary"
          size="md"
          onClick={onAddProject}
          className="shadow-elevation-low hover:shadow-elevation-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj projekt
        </Button>
      )}
    </div>
  )
}