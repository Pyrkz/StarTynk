import React from 'react'
import Link from 'next/link'
import { Building2, Calendar, MapPin, Home, Clock, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { ProjectCardProps } from './ProjectCard.types'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/features/projekty/constants'

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  className
}) => {
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const today = new Date()
  
  // Calculate project progress
  const totalDays = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 1)
  const daysElapsed = Math.max((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 0)
  const timeProgress = Math.min(Math.round((daysElapsed / totalDays) * 100), 100)
  
  // Calculate days remaining
  const daysRemaining = Math.max(Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0)

  const statusColor = PROJECT_STATUS_COLORS[project.status]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const CardContent = () => (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-1">
            {project.name}
          </h3>
          <div className="flex items-center text-sm text-neutral-600">
            <MapPin className="w-4 h-4 mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="line-clamp-1">{project.address}</span>
          </div>
        </div>
        <Badge 
          variant={statusColor} 
          size="md"
          className="flex-shrink-0"
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="flex items-center text-xs text-neutral-500 mb-1">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            Deweloper
          </div>
          <p className="text-sm font-medium text-neutral-900 line-clamp-1">
            {project.developer.name}
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="flex items-center text-xs text-neutral-500 mb-1">
            <Home className="w-3.5 h-3.5 mr-1" />
            Mieszkania
          </div>
          <p className="text-sm font-medium text-neutral-900">
            {project._count?.apartments || 0}
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="flex items-center text-xs text-neutral-500 mb-1">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Termin
          </div>
          <p className="text-sm font-medium text-neutral-900">
            {formatDate(endDate)}
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="flex items-center text-xs text-neutral-500 mb-1">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pozostało
          </div>
          <p className="text-sm font-medium text-neutral-900">
            {daysRemaining} dni
          </p>
        </div>
      </div>

      {/* Progress Section */}
      {project.status === 'ACTIVE' && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-neutral-600 font-medium">Postęp czasowy</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
              <span className="font-semibold text-neutral-900">{timeProgress}%</span>
            </div>
          </div>
          <div className="relative w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                timeProgress < 50 && "bg-success-500",
                timeProgress >= 50 && timeProgress < 80 && "bg-warning-500",
                timeProgress >= 80 && "bg-error-500"
              )}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
          {timeProgress >= 80 && (
            <p className="text-xs text-error-600 mt-1">
              Zbliża się termin zakończenia
            </p>
          )}
        </div>
      )}
    </>
  )

  const cardClass = cn(
    "group bg-white rounded-xl shadow-elevation-low",
    "hover:shadow-elevation-medium transition-all duration-300",
    "border border-neutral-200 hover:border-primary-200",
    "p-6 cursor-pointer relative overflow-hidden",
    "before:absolute before:inset-0 before:bg-gradient-to-br",
    "before:from-primary-50/0 before:to-primary-100/0",
    "hover:before:from-primary-50/50 hover:before:to-primary-100/30",
    "before:transition-all before:duration-300 before:-z-10",
    className
  )

  if (onClick) {
    return (
      <div onClick={() => onClick(project)} className={cardClass}>
        <CardContent />
      </div>
    )
  }

  return (
    <Link href={`/dashboard/projekty/${project.id}`}>
      <div className={cardClass}>
        <CardContent />
      </div>
    </Link>
  )
}