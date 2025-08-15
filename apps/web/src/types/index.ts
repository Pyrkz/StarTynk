import { 
  Vehicle, 
  VehicleAssignment,
  User,
  VehicleStatus,
  ReminderType
} from '@prisma/client'

// Vehicle types
export type VehicleWithCurrentAssignment = Vehicle & {
  assignments: (VehicleAssignment & { user: User })[]
}

export type VehicleStatistics = {
  total: number
  active: number
  inMaintenance: number
  retired: number
  dueForService: number
  dueForInspection: number
  dueForInsurance: number
}

export type UpcomingReminder = {
  id: string
  type: ReminderType
  dueDate: string
  description: string
  daysUntilDue: number
  urgency: 'normal' | 'warning' | 'urgent' | 'critical'
  vehicle: {
    id: string
    make: string
    model: string
    licensePlate: string
  }
}

export type VehicleCostSummary = {
  vehicleId: string
  vehicle: {
    make: string
    model: string
    licensePlate: string
  }
  totalCost: number
  maintenanceCost: number
  fuelCost: number
  insuranceCost: number
}

// Re-export Prisma types for vehicles only
export type { 
  Vehicle,
  VehicleAssignment,
  VehicleStatus,
  User,
  ReminderType
} from '@prisma/client'