import React from 'react'
import { cn } from '@/lib/utils'
import { ProjectsListProps } from './ProjectsList.types'
import { ProjectListItem } from '../ProjectListItem'

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  onProjectClick,
  showColumns = {
    developer: true,
    dates: true,
    status: true,
    progress: true,
    value: true,
    actions: true
  },
  className
}) => {
  return (
    <div className={cn('bg-white rounded-xl shadow-elevation-low border border-neutral-200 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Projekt
              </th>
              {showColumns.developer && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Deweloper
                </th>
              )}
              {showColumns.dates && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Terminy
                </th>
              )}
              {showColumns.status && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Status
                </th>
              )}
              {showColumns.progress && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Postęp
                </th>
              )}
              {showColumns.value && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Mieszkania
                </th>
              )}
              {showColumns.actions && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <span className="sr-only">Akcje</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onClick={onProjectClick}
                showColumns={showColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}