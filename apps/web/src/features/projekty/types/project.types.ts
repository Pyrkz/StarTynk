// Import types from centralized Prisma types file
import { ProjectStatus, TaskStatus, TaskPriority } from '@repo/shared/types'

// Re-export enums for consistency
export type { ProjectStatus, TaskStatus, TaskPriority }

// Export main types
export type { Project, Developer, User, Apartment, Task, TaskAssignment }
interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

interface Developer {
  id: string
  name: string
  address: string | null
  contact: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface Project {
  id: string
  name: string
  address: string
  developerId: string
  startDate: Date
  endDate: Date
  baseRate: number
  status: ProjectStatus
  description: string | null
  createdById: string
  coordinatorId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface Apartment {
  id: string
  projectId: string
  number: string
  floor: number | null
  area: number | null
  rooms: number | null
  type: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface Task {
  id: string
  projectId: string
  apartmentId: string | null
  title: string
  description: string | null
  area: number
  rate: number
  status: TaskStatus
  estimatedHours: number | null
  actualHours: number | null
  priority: TaskPriority
  dueDate: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface TaskAssignment {
  id: string
  taskId: string
  userId: string
  role: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}


export type ProjectWithRelations = Project & {
  developer: Developer
  createdBy: User
  coordinator?: User | null
  apartments?: Apartment[]
  tasks?: Task[]
  _count?: {
    apartments: number
    tasks: number
  }
}

export type ProjectListItem = Pick<
  Project,
  'id' | 'name' | 'address' | 'startDate' | 'endDate' | 'status' | 'baseRate'
> & {
  developer: Pick<Developer, 'id' | 'name'>
  coordinator?: Pick<User, 'id' | 'name'> | null
  _count?: {
    apartments: number
    tasks: number
  }
  value?: number
}

export interface CreateProjectInput {
  name: string
  address: string
  developerId: string
  startDate: Date
  endDate: Date
  baseRate: number
  description?: string
  coordinatorId?: string
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus
}

export interface ProjectFilters {
  search?: string
  status?: ProjectStatus
  developerId?: string
  coordinatorId?: string
  startDate?: Date
  endDate?: Date
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  totalValue: number
}

// Project Detail Page Types
export type ProjectDetailWithRelations = Project & {
  developer: Developer
  createdBy: User
  coordinator?: User | null
  apartments: ApartmentWithTasks[]
  tasks: TaskWithAssignments[]
  _count: {
    apartments: number
    tasks: number
  }
}

export type ApartmentWithTasks = Apartment & {
  tasks: TaskWithAssignments[]
  _count: {
    tasks: number
    completedTasks: number
  }
}

export type TaskWithAssignments = Task & {
  assignments: (TaskAssignment & {
    user: Pick<User, 'id' | 'name'>
  })[]
  project: Pick<Project, 'id' | 'name'>
  apartment?: Pick<Apartment, 'id' | 'number'> | null
}

export interface ApartmentStatus {
  not_started: 'not_started'
  in_progress: 'in_progress' 
  ready_for_inspection: 'ready_for_inspection'
  approved: 'approved'
}

export interface ProjectDetailMetrics {
  totalValue: number
  paidAmount: number
  paymentProgress: number
  timeProgress: number
  completionProgress: number
  apartmentsCompleted: number
  tasksCompleted: number
}

export interface ProjectTab {
  id: string
  label: string
  icon: string
  component?: React.ComponentType
}

export interface ApartmentListItem {
  id: string
  number: string
  floor: number | null
  area: number | null
  status: keyof ApartmentStatus
  progress: number
  assignedUser?: {
    id: string
    name: string
  } | null
  tasksCompleted: number
  totalTasks: number
}