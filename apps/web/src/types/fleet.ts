/**
 * Fleet-specific validation schemas and UI helpers
 * Base types are imported from @repo/shared/types
 */

import { 
  VehicleStatus, 
  MaintenanceType, 
  ReminderType,
  VehicleType
} from '@repo/shared/types'
import { z } from 'zod'

// Zod Schemas
export const vehicleSchema = z.object({
  make: z.string().min(1, 'Marka jest wymagana'),
  model: z.string().min(1, 'Model jest wymagany'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'Numer rejestracyjny jest wymagany'),
  vin: z.string().optional(),
  type: z.enum(['CAR', 'VAN', 'TRUCK', 'EQUIPMENT']),
  insuranceExpiry: z.date().optional(),
  inspectionExpiry: z.date().optional(),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).default('ACTIVE'),
  currentMileage: z.number().int().min(0).optional(),
})

export const maintenanceSchema = z.object({
  vehicleId: z.string(),
  type: z.enum(['INSPECTION', 'REPAIR', 'SERVICE', 'INSURANCE']),
  description: z.string().min(1, 'Opis jest wymagany'),
  cost: z.number().positive('Koszt musi być dodatni'),
  serviceDate: z.date(),
  nextDueDate: z.date().optional(),
  mileage: z.number().int().min(0).optional(),
  serviceProvider: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
})

export const reminderSchema = z.object({
  vehicleId: z.string(),
  type: z.enum(['INSPECTION', 'INSURANCE', 'SERVICE', 'REPAIR']),
  dueDate: z.date(),
  description: z.string().min(1, 'Opis jest wymagany'),
  daysBefore: z.number().int().min(1).max(90).default(7),
})

// Web UI specific vehicle extensions (not in database)
export interface VehicleUIExtensions {
  type?: VehicleType
  currentMileage?: number
  lastOilChangeMileage?: number | null
  lastTransOilChangeMileage?: number | null
  engineOilInterval?: number
  transOilInterval?: number
  tireRotationInterval?: number
  lastTireRotationMileage?: number | null
  generalServiceInterval?: number
  lastGeneralServiceMileage?: number | null
  photoUrl?: string | null
  location?: string | null
}

// Import base types from database
import type { 
  Vehicle,
  VehicleAssignment,
  VehicleMaintenance,
  VehicleReminder
} from '@repo/database'

// Extended vehicle type for UI
export type ExtendedVehicle = Vehicle & VehicleUIExtensions

// VehicleProjectAssignment interface for future use
export interface VehicleProjectAssignment {
  id: string
  vehicleId: string
  projectId: string
  startDate: Date
  endDate: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Extended Types with Relations for UI
export type VehicleWithRelations = ExtendedVehicle & {
  assignments: (VehicleAssignment & {
    user: {
      id: string
      name: string | null
      email: string
    }
  })[]
  projectAssignments: (VehicleProjectAssignment & {
    project: {
      id: string
      name: string
      address: string
    }
  })[]
  maintenances: VehicleMaintenance[]
  reminders: VehicleReminder[]
}

export type VehicleWithCurrentAssignment = ExtendedVehicle & {
  assignments: (VehicleAssignment & {
    user: {
      id: string
      name: string | null
      email: string
    }
  })[]
}

// Extended vehicle data for details page with UI-specific fields
export interface ExtendedVehicleData extends ExtendedVehicle {
  assignments: Array<{
    id: string
    userId: string
    vehicleId: string
    startDate: Date
    endDate: Date | null
    isActive: boolean
    notes: string | null
    createdAt: Date
    updatedAt: Date
    user: {
      id: string
      name: string | null
      email: string
      position: string | null
    }
  }>
  projectAssignments: Array<{
    id: string
    vehicleId: string
    projectId: string
    startDate: Date
    endDate: Date | null
    isActive: boolean
    notes: string | null
    createdAt: Date
    updatedAt: Date
    project: {
      id: string
      name: string
      address: string | null
      status: string
    }
  }>
  maintenances: Array<{
    id: string
    vehicleId: string
    type: MaintenanceType
    description: string
    cost: number
    serviceDate: Date
    nextDueDate: Date | null
    mileage: number | null
    serviceProvider: string | null
    invoiceUrl: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  reminders: Array<{
    id: string
    vehicleId: string
    type: ReminderType
    dueDate: Date
    description: string
    daysBefore: number
    isCompleted: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }>
  costAnalysis?: {
    thisYear: number
    thisMonth: number
    breakdown: {
      service: number
      fuel: number
      repairs: number
      insurance: number
    }
  }
  performanceMetrics?: {
    utilizationRate: number
    avgAssignmentDays: number
    totalProjects: number
    fuelEfficiency: number
    costPerKm: number
  }
  documents?: {
    id: string
    name: string
    type: string
    url: string
    uploadedAt: Date
  }[]
  photos?: string[]
}

// Additional cost fields for UI display
export interface VehicleCostSummaryExtended {
  vehicleId: string
  vehicle: {
    make: string
    model: string
    licensePlate: string
  }
  totalCost: number
  fuelCost: number
  maintenanceCost: number
  insuranceCost: number
  monthlyAverage: number
}

// Import UpcomingReminder type from index
import type { UpcomingReminder } from './index'

// Helper function to determine reminder urgency
export function getReminderUrgency(daysUntilDue: number): UpcomingReminder['urgency'] {
  if (daysUntilDue <= 1) return 'critical'
  if (daysUntilDue <= 7) return 'urgent'
  if (daysUntilDue <= 14) return 'warning'
  return 'normal'
}

// Helper function to format vehicle display name
export function getVehicleDisplayName(vehicle: { make: string; model: string; year: number }): string {
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`
}

// Helper function to translate vehicle type
export function translateVehicleType(type: VehicleType): string {
  const translations: Record<VehicleType, string> = {
    CAR: 'Samochód osobowy',
    VAN: 'Van',
    TRUCK: 'Ciężarówka',
    EQUIPMENT: 'Sprzęt',
  }
  return translations[type] || type
}

// Helper function to translate maintenance type
export function translateMaintenanceType(type: MaintenanceType): string {
  const translations: Record<MaintenanceType, string> = {
    INSPECTION: 'Przegląd techniczny',
    REPAIR: 'Naprawa',
    SERVICE: 'Serwis',
    INSURANCE: 'Ubezpieczenie',
  }
  return translations[type] || type
}

// Helper function to translate reminder type
export function translateReminderType(type: ReminderType): string {
  const translations: Record<ReminderType, string> = {
    INSPECTION: 'Przegląd techniczny',
    INSURANCE: 'Ubezpieczenie',
    SERVICE: 'Serwis',
    REPAIR: 'Naprawa',
  }
  return translations[type] || type
}

// Helper function to get status color
export function getVehicleStatusColor(status: VehicleStatus): string {
  const colors: Record<VehicleStatus, string> = {
    ACTIVE: 'success',
    MAINTENANCE: 'warning',
    RETIRED: 'error',
  }
  return colors[status] || 'neutral'
}

// Helper function to translate vehicle status
export function translateVehicleStatus(status: VehicleStatus): string {
  const translations: Record<VehicleStatus, string> = {
    ACTIVE: 'Aktywny',
    MAINTENANCE: 'W serwisie',
    RETIRED: 'Wycofany',
  }
  return translations[status] || status
}