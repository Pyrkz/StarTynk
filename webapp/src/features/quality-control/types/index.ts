// Re-export and extend base types from global types
import type { QualityControl as BaseQualityControl, QualityStatus } from '@/types/quality-control'

// Extend base QualityControl with additional fields
export interface QualityControl extends Omit<BaseQualityControl, 'task' | 'controller'> {
  task: QualityTask
  controller: Controller
  photos?: QualityPhoto[]
  priority?: Priority
}

export interface QualityTask {
  id: string
  title: string
  projectId: string
  project: {
    name: string
    location?: string
    client?: string
  }
  assignments: Array<{
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
  dueDate?: Date
}

export interface Controller {
  id: string
  name: string
  role?: string
  avatar?: string
}

export interface QualityPhoto {
  id: string
  url: string
  thumbnailUrl: string
  caption?: string
  createdAt: Date
}

// Add IN_REVIEW status and use QualityStatus from base types
export type QualityControlStatus = QualityStatus | 'IN_REVIEW'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface QualityControlStats {
  totalTasks: number
  pendingReview: number
  approved: number
  rejected: number
  partiallyApproved?: number
  inReview?: number
  averageQualityScore: number
  completionRate: number
  trends?: {
    daily: TrendData[]
    weekly: TrendData[]
  }
  performanceByProject?: ProjectPerformance[]
}

export interface TrendData {
  date: string
  value: number
  label: string
}

export interface ProjectPerformance {
  projectId: string
  projectName: string
  tasksCount: number
  averageScore: number
  completionRate: number
}

export interface QualityFilters {
  status: QualityControlStatus | 'all'
  priority: Priority | 'all'
  projectId: string | 'all'
  dateRange: DateRange
  search: string
  assigneeId: string | 'all'
  month?: number | 'all'
  year?: number | 'all'
}

export interface DateRange {
  start: Date | null
  end: Date | null
}

export interface SortConfig {
  field: 'date' | 'priority' | 'score' | 'completion' | 'project'
  order: 'asc' | 'desc'
}

// Helper functions for status colors
export const getStatusColor = (status: QualityControlStatus): string => {
  const colors: Record<QualityControlStatus, string> = {
    PENDING: 'text-amber-700',
    APPROVED: 'text-emerald-700',
    REJECTED: 'text-red-700',
    PARTIALLY_APPROVED: 'text-orange-700',
    IN_REVIEW: 'text-blue-700'
  }
  return colors[status] || 'text-gray-700'
}

export const getStatusBgColor = (status: QualityControlStatus): string => {
  const colors: Record<QualityControlStatus, string> = {
    PENDING: 'bg-amber-50 border-amber-200',
    APPROVED: 'bg-emerald-50 border-emerald-200',
    REJECTED: 'bg-red-50 border-red-200',
    PARTIALLY_APPROVED: 'bg-orange-50 border-orange-200',
    IN_REVIEW: 'bg-blue-50 border-blue-200'
  }
  return colors[status] || 'bg-gray-50 border-gray-200'
}

export const getQualityScoreColor = (score: number): string => {
  if (score >= 90) return 'text-emerald-700'
  if (score >= 75) return 'text-blue-700'
  if (score >= 60) return 'text-amber-700'
  return 'text-red-700'
}

export const getQualityScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-emerald-50 border-emerald-200'
  if (score >= 75) return 'bg-blue-50 border-blue-200'
  if (score >= 60) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export const getPriorityColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    URGENT: 'text-red-700',
    HIGH: 'text-orange-700',
    MEDIUM: 'text-blue-700',
    LOW: 'text-gray-700'
  }
  return colors[priority]
}

export const getPriorityBgColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    URGENT: 'bg-red-50 border-red-200',
    HIGH: 'bg-orange-50 border-orange-200',
    MEDIUM: 'bg-blue-50 border-blue-200',
    LOW: 'bg-gray-50 border-gray-200'
  }
  return colors[priority]
}