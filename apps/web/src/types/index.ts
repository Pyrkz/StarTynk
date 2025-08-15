/**
 * Web-specific type extensions
 * These types extend the base types from @repo/shared/types with UI-specific fields
 */

import type { ReminderType } from '@repo/shared/types';
import type { Vehicle, VehicleAssignment, User } from '@repo/database';

// Vehicle types with UI-specific extensions
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