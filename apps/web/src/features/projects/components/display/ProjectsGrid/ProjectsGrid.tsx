import React from 'react'
import { ProjectListItem } from '@/features/projekty/types'
import { ProjectCard } from '../ProjectCard'
import { cn } from '@/lib/utils'

interface ProjectsGridProps {
  projects: ProjectListItem[]
  onProjectClick?: (project: ProjectListItem) => void
  className?: string
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  onProjectClick,
  className
}) => {
  return (
    <div className={cn(
      'grid grid-cols-1 lg:grid-cols-2 gap-6',
      'animate-fade-in',
      className
    )}>
      {projects.map((project, index) => (
        <div
          key={project.id}
          style={{
            animationDelay: `${index * 50}ms`
          }}
          className="animate-slide-up"
        >
          <ProjectCard
            project={project}
            onClick={onProjectClick}
          />
        </div>
      ))}
    </div>
  )
}