import { User, InvitationCode, Role, UserActivityLog } from '@repo/database/client-types'

// Enhanced User type with relations
export interface UserWithRelations extends User {
  inviterUser?: User | null
  invitationsSent?: InvitationCode[]
  activityLogs?: UserActivityLog[]
  _count?: {
    taskAssignments?: number
    invitationsSent?: number
    activityLogs?: number
  }
}

// User list filters
export interface UserFilters {
  search?: string
  role?: Role | 'ALL'
  isActive?: boolean | 'ALL'
  department?: string
  hasLogin?: boolean
  dateFrom?: Date
  dateTo?: Date
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt' | 'role'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// User creation/update DTOs
export interface CreateUserDTO {
  email: string
  name?: string
  role: Role
  phone?: string
  position?: string
  department?: string
  employmentStartDate?: Date
  sendInvitation?: boolean
  customMessage?: string
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  role?: Role
  phone?: string
  position?: string
  department?: string
  isActive?: boolean
  employmentStartDate?: Date
  employmentEndDate?: Date
}

// Invitation types
export interface InvitationWithInviter extends InvitationCode {
  inviter: User
}

export interface CreateInvitationDTO {
  email: string
  role: Role
  message?: string
  expiresInDays?: number
}

export interface BulkInvitationDTO {
  invitations: CreateInvitationDTO[]
}

// Activity log types
export interface ActivityLogDetails {
  previousValue?: unknown
  newValue?: unknown
  reason?: string
  performedBy?: string
  [key: string]: unknown
}

// Response types
export interface UsersListResponse {
  users: UserWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface InvitationsListResponse {
  invitations: InvitationWithInviter[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Bulk operation types
export interface BulkUserUpdateDTO {
  userIds: string[]
  updates: {
    role?: Role
    isActive?: boolean
    department?: string
  }
}

export interface BulkOperationResult {
  success: number
  failed: number
  errors?: Array<{
    userId: string
    error: string
  }>
}

// Statistics types
export interface UserStatistics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  usersByRole: Record<Role, number>
  usersByDepartment: Record<string, number>
  recentlyActive: number
  pendingInvitations: number
}