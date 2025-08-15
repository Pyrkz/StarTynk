import React from 'react'
import Link from 'next/link'
import { 
  MapPin, 
  Calendar, 
  Building2, 
  Home,
  MoreVertical,
  ExternalLink,
  Edit,
  Archive
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { ProjectListItemProps } from './ProjectListItem.types'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/features/projekty/constants'

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  onClick,
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
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const today = new Date()
  
  // Calculate project progress
  const totalDays = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 1)
  const daysElapsed = Math.max((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24), 0)
  const timeProgress = Math.min(Math.round((daysElapsed / totalDays) * 100), 100)

  const statusColor = PROJECT_STATUS_COLORS[project.status]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const [showActions, setShowActions] = React.useState(false)

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-menu')) {
      return
    }
    onClick?.(project)
  }

  const RowContent = () => (
    <>
      {/* Project Info */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <h3 className="font-semibold text-neutral-900 mb-1">{project.name}</h3>
          <div className="flex items-center text-sm text-neutral-600">
            <MapPin className="w-4 h-4 mr-1.5 text-neutral-400" />
            {project.address}
          </div>
        </div>
      </td>

      {/* Developer */}
      {showColumns.developer && (
        <td className="px-6 py-4">
          <div className="flex items-center text-sm">
            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
            <span className="text-neutral-700">{project.developer.name}</span>
          </div>
        </td>
      )}

      {/* Dates */}
      {showColumns.dates && (
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center text-neutral-600">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
              {formatDate(startDate)}
            </div>
            <div className="flex items-center text-neutral-900 font-medium">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
              {formatDate(endDate)}
            </div>
          </div>
        </td>
      )}

      {/* Status */}
      {showColumns.status && (
        <td className="px-6 py-4">
          <Badge variant={statusColor} size="md">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </td>
      )}

      {/* Progress */}
      {showColumns.progress && (
        <td className="px-6 py-4">
          {project.status === 'ACTIVE' ? (
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-600">Postęp</span>
                <span className="font-semibold text-neutral-900">{timeProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-700",
                    timeProgress < 50 && "bg-success-500",
                    timeProgress >= 50 && timeProgress < 80 && "bg-warning-500",
                    timeProgress >= 80 && "bg-error-500"
                  )}
                  style={{ width: `${timeProgress}%` }}
                  role="progressbar"
                  aria-valuenow={timeProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ) : (
            <span className="text-sm text-neutral-500">—</span>
          )}
        </td>
      )}

      {/* Value/Apartments */}
      {showColumns.value && (
        <td className="px-6 py-4">
          <div className="flex items-center text-sm">
            <Home className="w-4 h-4 mr-2 text-neutral-400" />
            <span className="text-neutral-900 font-medium">
              {project._count?.apartments || 0}
            </span>
            <span className="text-neutral-600 ml-1">mieszkań</span>
          </div>
        </td>
      )}

      {/* Actions */}
      {showColumns.actions && (
        <td className="px-6 py-4">
          <div className="relative action-menu">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowActions(!showActions)
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              )}
              aria-label="Więcej opcji"
            >
              <MoreVertical className="w-5 h-5 text-neutral-600" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className={cn(
                  "absolute right-0 top-full mt-1 z-20",
                  "bg-white rounded-lg shadow-elevation-high border border-neutral-200",
                  "py-1 min-w-[200px]",
                  "animate-scale-in"
                )}>
                  <Link
                    href={`/dashboard/projekty/${project.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Otwórz projekt
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edytuj
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archiwizuj
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      )}
    </>
  )

  const rowClass = cn(
    "border-b border-neutral-100 transition-colors duration-200",
    onClick && "hover:bg-neutral-50 cursor-pointer",
    className
  )

  if (onClick) {
    return (
      <tr onClick={handleRowClick} className={rowClass} role="row">
        <RowContent />
      </tr>
    )
  }

  return (
    <tr className={rowClass}>
      <RowContent />
    </tr>
  )
}