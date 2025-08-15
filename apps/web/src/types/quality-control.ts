export type QualityStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_APPROVED'

export type QualityIssueType = 'OUR_FAULT' | 'EXTERNAL_FAULT' | 'MATERIAL_DEFECT' | 'DESIGN_ISSUE'

export type QualityAction = 'SUBMITTED' | 'REVIEWED' | 'REJECTED' | 'PARTIALLY_APPROVED' | 'APPROVED' | 'CORRECTED' | 'RESUBMITTED'

export type PhotoType = 'BEFORE' | 'AFTER' | 'ISSUE' | 'DOCUMENTATION' | 'INVOICE'

export interface QualityControl {
  id: string
  taskId: string
  controllerId: string
  controlNumber: number
  status: QualityStatus
  completionRate: number
  qualityScore: number
  reportedArea?: number
  correctedArea?: number
  reportedLength?: number
  correctedLength?: number
  notes?: string
  issuesFound?: string
  correctionsNeeded?: string
  controlDate: Date
  recontrolDate?: Date
  issueType?: QualityIssueType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  task: {
    id: string
    title: string
    projectId: string
    project: {
      name: string
    }
    assignments: Array<{
      user: {
        id: string
        name: string
      }
    }>
  }
  controller: {
    id: string
    name: string
  }
  history: QualityControlHistory[]
}

export interface QualityControlHistory {
  id: string
  qualityControlId: string
  action: QualityAction
  userId: string
  qualityScore?: number
  completionRate?: number
  notes?: string
  actionDate: Date
  isActive: boolean
  createdAt: Date
}

export interface QualityPhoto {
  id: string
  url: string
  description?: string
  type: PhotoType
  entityType: string
  entityId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QualityControlStats {
  totalTasks: number
  pendingReview: number
  approved: number
  rejected: number
  averageQualityScore: number
  completionRate: number
}

export interface QualityScoreOption {
  value: number
  label: string
  description: string
  color: string
}

export const QUALITY_SCORE_OPTIONS: QualityScoreOption[] = [
  {
    value: 100,
    label: '100% - Perfect',
    description: 'Work completed to highest standard with no issues',
    color: 'text-green-600'
  },
  {
    value: 90,
    label: '90% - Excellent',
    description: 'Minor cosmetic issues',
    color: 'text-green-500'
  },
  {
    value: 80,
    label: '80% - Good',
    description: 'Some rework required',
    color: 'text-yellow-500'
  },
  {
    value: 70,
    label: '70% - Acceptable',
    description: 'Significant corrections needed',
    color: 'text-orange-500'
  },
  {
    value: 50,
    label: '50% - Poor',
    description: 'Major rework required',
    color: 'text-red-500'
  },
  {
    value: 0,
    label: '0% - Rejected',
    description: 'Complete redo required',
    color: 'text-red-600'
  }
]

export const getQualityScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-green-500'
  if (score >= 70) return 'text-yellow-500'
  if (score >= 50) return 'text-orange-500'
  return 'text-red-600'
}

export const getQualityScoreBgColor = (score: number): string => {
  if (score >= 90) return 'bg-green-100'
  if (score >= 80) return 'bg-green-50'
  if (score >= 70) return 'bg-yellow-50'
  if (score >= 50) return 'bg-orange-50'
  return 'bg-red-50'
}

export const getStatusColor = (status: QualityStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-600'
    case 'APPROVED':
      return 'text-green-600'
    case 'REJECTED':
      return 'text-red-600'
    case 'PARTIALLY_APPROVED':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}

export const getStatusBgColor = (status: QualityStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100'
    case 'APPROVED':
      return 'bg-green-100'
    case 'REJECTED':
      return 'bg-red-100'
    case 'PARTIALLY_APPROVED':
      return 'bg-orange-100'
    default:
      return 'bg-gray-100'
  }
}