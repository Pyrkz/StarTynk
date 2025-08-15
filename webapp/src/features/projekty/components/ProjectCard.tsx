import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { ProjectListItem } from '../types'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../constants'
import { Building2, Calendar, MapPin, Home } from 'lucide-react'

interface ProjectCardProps {
  project: ProjectListItem
  className?: string
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
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
        "bg-white rounded-lg shadow-elevation-low hover:shadow-elevation-medium transition-all duration-200 p-6 cursor-pointer border border-neutral-200 hover:border-primary-300",
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              {project.name}
            </h3>
            <div className="flex items-center text-sm text-neutral-600">
              <MapPin className="w-4 h-4 mr-1" />
              {project.address}
            </div>
          </div>
          <Badge 
            variant={statusColor} 
            size="md"
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-neutral-600">
            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
            <span>{project.developer.name}</span>
          </div>

          <div className="flex items-center text-sm text-neutral-600">
            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
          </div>

          <div className="flex items-center text-sm text-neutral-600">
            <Home className="w-4 h-4 mr-2 text-neutral-400" />
            <span>{project._count?.apartments || 0} mieszkań</span>
          </div>

          <div className="flex items-center text-sm text-neutral-600">
            <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
            <span>Zadania: {project._count?.tasks || 0}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {project.status === 'ACTIVE' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-600 mb-1">
              <span>Postęp czasowy</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

      </div>
    </Link>
  )
}

export { ProjectCard }