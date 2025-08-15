import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { ProjectListItem as ProjectType } from '../types'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../constants'
import { Building2, MapPin, Home, ChevronRight } from 'lucide-react'

interface ProjectListItemProps {
  project: ProjectType
  className?: string
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, className }) => {
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const today = new Date()
  
  // Calculate project progress
  const totalDays = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 1)
  const daysElapsed = Math.max((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 0)
  const progress = Math.min(Math.round((daysElapsed / totalDays) * 100), 100)

  const statusColor = PROJECT_STATUS_COLORS[project.status]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <Link href={`/dashboard/projekty/${project.id}`}>
      <div className={cn(
        "bg-white border border-neutral-200 hover:border-primary-300 transition-all duration-200 p-4 cursor-pointer group",
        className
      )}>
        <div className="flex items-center gap-4">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-semibold text-neutral-900 truncate">
                {project.name}
              </h3>
              <Badge 
                variant={statusColor} 
                size="sm"
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span className="truncate">{project.address}</span>
              </div>
              <div className="hidden sm:flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                <span className="truncate">{project.developer.name}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-neutral-500">Termin</div>
              <div className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                {formatDate(endDate)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-neutral-500">Mieszkania</div>
              <div className="text-sm font-medium text-neutral-900">
                {project._count?.apartments || 0}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-neutral-500">Zadania</div>
              <div className="text-sm font-medium text-neutral-900">
                {project._count?.tasks || 0}
              </div>
            </div>

            {project.status === 'ACTIVE' && (
              <div className="w-24">
                <div className="text-xs text-neutral-500 mb-1">Postęp</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-neutral-700">{progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

export { ProjectListItem }