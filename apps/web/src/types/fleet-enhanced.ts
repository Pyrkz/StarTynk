// Import types from fleet.ts
import type { 
  Vehicle, 
  VehicleAssignment, 
  VehicleMaintenance, 
  VehicleReminder, 
  VehicleProjectAssignment,
  VehicleStatus,
  VehicleType,
  MaintenanceType,
  ReminderType
} from './fleet'
import { z } from 'zod'

// Re-export types
export type { 
  Vehicle, 
  VehicleAssignment, 
  VehicleMaintenance, 
  VehicleReminder, 
  VehicleProjectAssignment,
  VehicleStatus,
  VehicleType,
  MaintenanceType,
  ReminderType
}

// Service Alert Types
export type ServiceAlertType = 'ENGINE_OIL' | 'TRANSMISSION_OIL' | 'TIRE_ROTATION' | 'GENERAL_SERVICE' | 'INSPECTION' | 'INSURANCE'
export type ServiceAlertUrgency = 'critical' | 'urgent' | 'warning' | 'upcoming' | 'normal'
export type ServiceAlertStatus = 'overdue' | 'due_soon' | 'upcoming' | 'ok'

export interface ServiceInterval {
  type: ServiceAlertType
  currentMileage: number
  lastServiceMileage: number | null
  intervalMileage: number
  remainingMileage: number
  percentageUsed: number
  status: ServiceAlertStatus
  urgency: ServiceAlertUrgency
  dueDate?: Date
  daysRemaining?: number
}

export interface ServiceAlert {
  id: string
  vehicleId: string
  type: ServiceAlertType
  urgency: ServiceAlertUrgency
  status: ServiceAlertStatus
  message: string
  remainingValue: number // km or days
  isDistanceBased: boolean
  dueDate?: Date
  percentageUsed: number
}

// Enhanced Vehicle Types with Relations
export type VehicleWithFullRelations = Vehicle & {
  assignments: (VehicleAssignment & {
    user: {
      id: string
      name: string | null
      email: string
      position: string | null
      department: string | null
    }
  })[]
  projectAssignments: (VehicleProjectAssignment & {
    project: {
      id: string
      name: string
      address: string
      status: string
    }
  })[]
  maintenances: VehicleMaintenance[]
  reminders: VehicleReminder[]
}

// Dashboard Statistics
export interface EnhancedVehicleStatistics {
  total: number
  active: number
  inService: number
  retired: number
  available: number
  assignedToEmployees: number
  assignedToProjects: number
  alerts: {
    critical: number
    urgent: number
    warning: number
    total: number
  }
  monthlyMetrics: {
    costs: number
    servicesCompleted: number
    averageCostPerVehicle: number
    trend: number // percentage change from last month
  }
}

// Fleet Overview Card
export interface FleetOverviewCard {
  id: string
  make: string
  model: string
  year: number
  type: VehicleType
  licensePlate: string
  status: VehicleStatus
  photoUrl?: string
  currentAssignment?: {
    type: 'employee' | 'project'
    assignedTo: string
    assignedToId: string
    location?: string
  }
  serviceAlerts: ServiceAlert[]
  upcomingServices: {
    engineOil: ServiceInterval
    transmissionOil: ServiceInterval
    tireRotation?: ServiceInterval
    generalService?: ServiceInterval
    inspection?: {
      dueDate: Date
      daysRemaining: number
      status: ServiceAlertStatus
    }
    insurance?: {
      dueDate: Date
      daysRemaining: number
      status: ServiceAlertStatus
    }
  }
  quickStats: {
    totalAlerts: number
    criticalAlerts: number
    monthlyServiceCost: number
  }
}

// Service Management
export interface ServiceScheduleRequest {
  vehicleId: string
  serviceType: ServiceAlertType
  scheduledDate: Date
  estimatedCost?: number
  serviceProvider?: string
  notes?: string
}

export interface BulkServiceOperation {
  vehicleIds: string[]
  operation: 'schedule' | 'complete' | 'snooze'
  serviceType?: ServiceAlertType
  scheduledDate?: Date
  completionData?: {
    mileage: number
    cost: number
    invoiceUrl?: string
  }
}

// Filtering and Search
export interface FleetFilterOptions {
  status?: VehicleStatus[]
  serviceStatus?: ('up_to_date' | 'due_soon' | 'overdue')[]
  assignmentType?: ('unassigned' | 'employee' | 'project')[]
  vehicleType?: VehicleType[]
  location?: string[]
  alertUrgency?: ServiceAlertUrgency[]
}

export interface FleetSearchParams {
  query?: string
  filters: FleetFilterOptions
  sortBy?: 'status' | 'alerts' | 'assignment' | 'nextService' | 'cost'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Helper Functions
export function calculateServiceStatus(
  currentMileage: number,
  lastServiceMileage: number | null,
  intervalMileage: number
): ServiceInterval {
  const mileageSinceLastService = lastServiceMileage ? currentMileage - lastServiceMileage : currentMileage
  const remainingMileage = intervalMileage - mileageSinceLastService
  const percentageUsed = (mileageSinceLastService / intervalMileage) * 100

  let status: ServiceAlertStatus = 'ok'
  let urgency: ServiceAlertUrgency = 'normal'

  if (remainingMileage <= 0) {
    status = 'overdue'
    urgency = 'critical'
  } else if (remainingMileage <= 250) {
    status = 'due_soon'
    urgency = 'urgent'
  } else if (remainingMileage <= 500) {
    status = 'due_soon'
    urgency = 'warning'
  } else if (remainingMileage <= 1000) {
    status = 'upcoming'
    urgency = 'upcoming'
  }

  return {
    type: 'ENGINE_OIL', // This should be passed as parameter
    currentMileage,
    lastServiceMileage,
    intervalMileage,
    remainingMileage: Math.max(0, remainingMileage),
    percentageUsed: Math.min(100, percentageUsed),
    status,
    urgency
  }
}

export function calculateDateBasedStatus(
  dueDate: Date,
  currentDate: Date = new Date()
): { status: ServiceAlertStatus; urgency: ServiceAlertUrgency; daysRemaining: number } {
  const msPerDay = 24 * 60 * 60 * 1000
  const daysRemaining = Math.floor((dueDate.getTime() - currentDate.getTime()) / msPerDay)

  let status: ServiceAlertStatus = 'ok'
  let urgency: ServiceAlertUrgency = 'normal'

  if (daysRemaining < 0) {
    status = 'overdue'
    urgency = 'critical'
  } else if (daysRemaining <= 7) {
    status = 'due_soon'
    urgency = 'urgent'
  } else if (daysRemaining <= 14) {
    status = 'due_soon'
    urgency = 'warning'
  } else if (daysRemaining <= 30) {
    status = 'upcoming'
    urgency = 'upcoming'
  }

  return { status, urgency, daysRemaining }
}

export function getServiceAlertIcon(type: ServiceAlertType): string {
  const icons: Record<ServiceAlertType, string> = {
    ENGINE_OIL: '🔧',
    TRANSMISSION_OIL: '⚙️',
    TIRE_ROTATION: '🔩',
    GENERAL_SERVICE: '🔧',
    INSPECTION: '🛡️',
    INSURANCE: '📋'
  }
  return icons[type] || '🔧'
}

export function getServiceAlertMessage(type: ServiceAlertType, remaining: number, isDistanceBased: boolean): string {
  const unit = isDistanceBased ? 'km' : (remaining === 1 ? 'dzień' : 'dni')
  const prefix = remaining < 0 ? 'Zaległe o' : 'Pozostało'
  const value = Math.abs(remaining)

  const typeNames: Record<ServiceAlertType, string> = {
    ENGINE_OIL: 'Wymiana oleju silnikowego',
    TRANSMISSION_OIL: 'Wymiana oleju przekładniowego',
    TIRE_ROTATION: 'Rotacja opon',
    GENERAL_SERVICE: 'Serwis generalny',
    INSPECTION: 'Przegląd techniczny',
    INSURANCE: 'Ubezpieczenie'
  }

  return `${typeNames[type]}: ${prefix} ${value} ${unit}`
}

export function getUrgencyColor(urgency: ServiceAlertUrgency): string {
  const colors: Record<ServiceAlertUrgency, string> = {
    critical: 'text-red-600 bg-red-100',
    urgent: 'text-orange-600 bg-orange-100',
    warning: 'text-yellow-600 bg-yellow-100',
    upcoming: 'text-blue-600 bg-blue-100',
    normal: 'text-gray-600 bg-gray-100'
  }
  return colors[urgency]
}

export function getStatusBadgeVariant(status: ServiceAlertStatus): 'error' | 'warning' | 'primary' | 'success' {
  const variants: Record<ServiceAlertStatus, 'error' | 'warning' | 'primary' | 'success'> = {
    overdue: 'error',
    due_soon: 'warning',
    upcoming: 'primary',
    ok: 'success'
  }
  return variants[status]
}

// Validation Schemas
export const enhancedVehicleSchema = z.object({
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
  currentMileage: z.number().int().min(0),
  engineOilInterval: z.number().int().min(1000).max(20000).default(5000),
  transOilInterval: z.number().int().min(10000).max(100000).default(25000),
  tireRotationInterval: z.number().int().min(5000).max(20000).default(8000),
  generalServiceInterval: z.number().int().min(10000).max(50000).default(15000),
  photoUrl: z.string().url().optional(),
  location: z.string().optional()
})

export const serviceScheduleSchema = z.object({
  vehicleId: z.string(),
  serviceType: z.enum(['ENGINE_OIL', 'TRANSMISSION_OIL', 'TIRE_ROTATION', 'GENERAL_SERVICE', 'INSPECTION', 'INSURANCE']),
  scheduledDate: z.date(),
  estimatedCost: z.number().positive().optional(),
  serviceProvider: z.string().optional(),
  notes: z.string().optional()
})

// Enhanced Service System Types for Comprehensive Fleet Management

export type EnhancedServiceType = 'ENGINE_OIL' | 'TRANSMISSION_OIL' | 'TECHNICAL_INSPECTION' | 'REPAIR'
export type ServiceStatusEnhanced = 'ok' | 'upcoming' | 'due_soon' | 'overdue'
export type RepairStatus = 'DROPPED_OFF' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED'
export type RepairType = 'DROP_OFF' | 'PICKUP' | 'COMPLETED'
export type ServiceUrgency = 'normal' | 'upcoming' | 'warning' | 'critical'

// Engine Oil Service Interface
export interface EngineOilService {
  id: string
  vehicleId: string
  serviceDate: Date
  mileage: number
  oilType: string // '5W-30', '10W-40', etc.
  oilQuantity: number // liters
  filterChanged: boolean
  nextDueMileage: number
  nextDueDate: Date
  cost: number
  serviceProvider: string
  invoiceNumber?: string
  notes?: string
  photos?: string[] // before/after photos
  createdAt: Date
  updatedAt: Date
}

// Transmission Oil Service Interface
export interface TransmissionOilService {
  id: string
  vehicleId: string
  serviceDate: Date
  mileage: number
  oilType: string // 'ATF', 'Manual Transmission Fluid', etc.
  oilQuantity: number
  filterChanged: boolean // if automatic transmission
  nextDueMileage: number
  nextDueDate: Date
  cost: number
  serviceProvider: string
  invoiceNumber?: string
  notes?: string
  photos?: string[]
  createdAt: Date
  updatedAt: Date
}

// Technical Inspection Interface
export interface TechnicalInspection {
  id: string
  vehicleId: string
  inspectionDate: Date
  mileage: number
  passed: boolean
  validUntil: Date
  inspectionCenter: string
  cost: number
  defectsFound: string[]
  repairsRequired: boolean
  certificateNumber?: string
  invoiceNumber?: string
  notes?: string
  documentPhotos?: string[] // inspection certificate photos
  createdAt: Date
  updatedAt: Date
}

// Repair Service Interface
export interface RepairService {
  id: string
  vehicleId: string
  repairType: RepairType
  dropOffDate?: Date
  pickupDate?: Date
  estimatedCompletionDate?: Date
  actualCompletionDate?: Date
  mileage: number
  description: string
  repairItems: {
    item: string
    quantity: number
    unitCost: number
    warrantyMonths?: number
  }[]
  totalCost: number
  serviceProvider: string
  contactPerson?: string
  warrantyInfo?: string
  invoiceNumber?: string
  notes?: string
  photos?: string[] // damage/repair photos
  status: RepairStatus
  createdAt: Date
  updatedAt: Date
}

// Service Provider Interface
export interface ServiceProvider {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  specialties: EnhancedServiceType[]
  averageRating: number
  preferredForVehicleTypes: VehicleType[]
  priceList: {
    serviceType: EnhancedServiceType
    averageCost: number
    laborRate: number
  }[]
  createdAt: Date
  updatedAt: Date
}

// Service Intervals Configuration
export interface ServiceIntervalsEnhanced {
  engineOil: {
    intervalKm: number
    lastServiceMileage: number
    nextDueMileage: number
    remainingKm: number
    nextDueDate: string
    status: ServiceStatusEnhanced
  }
  transmissionOil: {
    intervalKm: number
    lastServiceMileage: number
    nextDueMileage: number
    remainingKm: number
    nextDueDate: string
    status: ServiceStatusEnhanced
  }
  technicalInspection: {
    lastInspectionDate: string
    nextDueDate: string
    daysRemaining: number
    status: ServiceStatusEnhanced
  }
}

// Upcoming Service Interface
export interface UpcomingServiceEnhanced {
  id: string
  vehicleId: string
  vehicleInfo: {
    make: string
    model: string
    year: number
    licensePlate: string
    photoUrl?: string
  }
  type: EnhancedServiceType
  dueIn: string // "2000 km" or "45 days"
  urgency: ServiceUrgency
  estimatedCost: number
  description?: string
  nextDueDate: Date
  nextDueMileage?: number
  currentMileage?: number
  targetMileage?: number
}

// Service History Record
export interface ServiceRecordEnhanced {
  id: string
  vehicleId: string
  type: EnhancedServiceType
  date: Date
  mileage?: number
  cost: number
  provider: string
  details: Record<string, string | number | boolean>
  invoiceNumber?: string
  notes?: string
  photos?: string[]
  nextDueDate?: Date
  nextDueMileage?: number
}

// Enhanced Vehicle with Comprehensive Service Data
export interface VehicleWithServicesEnhanced extends Vehicle {
  serviceIntervals: ServiceIntervalsEnhanced
  upcomingServices: UpcomingServiceEnhanced[]
  serviceHistory: ServiceRecordEnhanced[]
  activeRepairs: {
    id: string
    status: RepairStatus
    description: string
    dropOffDate: string
    estimatedCompletion: string
    serviceProvider: string
    estimatedCost: number
    contactPerson?: string
    repairItems?: string[]
  }[]
  assignments: Array<{
    id: string
    userId: string
    vehicleId: string
    startDate: Date
    endDate: Date | null
    isActive: boolean
    user: {
      id: string
      name: string | null
      email: string
      position?: string | null
    }
  }>
  serviceStats: {
    totalServicesThisYear: number
    totalServiceCosts: number
    lastServiceDate?: Date
    nextServiceDue?: Date
    averageServiceCost: number
    maintenanceCompliance: number // percentage
  }
}

// Service Scheduling Data
export interface ScheduleServiceDataEnhanced {
  vehicleId: string
  serviceType: EnhancedServiceType
  scheduledDate: Date
  serviceProviderId: string
  estimatedCost: number
  notes?: string
  isRecurring?: boolean
  recurringInterval?: number // in km or days
  specialRequirements?: string[]
  preferredTime?: string
}

// Service History Filters
export interface ServiceHistoryFiltersEnhanced {
  serviceType?: EnhancedServiceType
  dateFrom?: Date
  dateTo?: Date
  costMin?: number
  costMax?: number
  provider?: string
  vehicleId?: string
  sortBy?: 'date' | 'cost' | 'type' | 'provider'
  sortOrder?: 'asc' | 'desc'
}

// Service Statistics
export interface ServiceStatisticsEnhanced {
  totalVehicles: number
  servicesThisMonth: number
  upcomingServices: number
  overdueServices: number
  totalServiceCosts: number
  averageCostPerVehicle: number
  mostCommonServiceType: EnhancedServiceType
  totalActiveRepairs: number
  serviceComplianceRate: number // percentage of vehicles up to date
  costTrend: number // percentage change from last month
  topServiceProviders: {
    name: string
    serviceCount: number
    averageCost: number
    rating: number
  }[]
}

// Service Deadline Widget Data
export interface ServiceDeadlineDataEnhanced {
  overdue: UpcomingServiceEnhanced[]
  dueSoon: UpcomingServiceEnhanced[]
  upcoming: UpcomingServiceEnhanced[]
  totalCount: number
  criticalCount: number
  warningCount: number
  upcomingCount: number
}

// Service Progress Bar Props
export interface ServiceProgressPropsEnhanced {
  serviceType: string
  current: number
  target: number
  unit: 'km' | 'days'
  status: ServiceStatusEnhanced
  description?: string
  lastServiceDate?: Date
  nextServiceDate?: Date
  progress: number // 0-100
  isOverdue: boolean
}

// Mock Data for Development
export const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'sp-001',
    name: 'AutoService Plus',
    address: 'ul. Warsztatowa 15, 00-001 Warszawa',
    phone: '+48 22 123 45 67',
    email: 'kontakt@autoservice-plus.pl',
    specialties: ['ENGINE_OIL', 'TRANSMISSION_OIL', 'REPAIR'],
    averageRating: 4.8,
    preferredForVehicleTypes: ['CAR', 'VAN'],
    priceList: [
      { serviceType: 'ENGINE_OIL', averageCost: 150, laborRate: 80 },
      { serviceType: 'TRANSMISSION_OIL', averageCost: 300, laborRate: 80 },
      { serviceType: 'REPAIR', averageCost: 250, laborRate: 120 }
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'sp-002',
    name: 'MOT Center Downtown',
    address: 'ul. Kontrolna 8, 00-002 Warszawa',
    phone: '+48 22 987 65 43',
    email: 'mot@center-downtown.pl',
    specialties: ['TECHNICAL_INSPECTION'],
    averageRating: 4.5,
    preferredForVehicleTypes: ['CAR', 'VAN', 'TRUCK'],
    priceList: [
      { serviceType: 'TECHNICAL_INSPECTION', averageCost: 100, laborRate: 60 }
    ],
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'sp-003',
    name: 'Klimat-Auto',
    address: 'ul. Chłodnicza 22, 00-003 Warszawa',
    phone: '+48 22 555 44 33',
    email: 'serwis@klimat-auto.pl',
    specialties: ['REPAIR'],
    averageRating: 4.6,
    preferredForVehicleTypes: ['CAR', 'VAN'],
    priceList: [
      { serviceType: 'REPAIR', averageCost: 350, laborRate: 100 }
    ],
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-08')
  }
]

export const mockVehiclesWithServicesEnhanced: VehicleWithServicesEnhanced[] = [
  // Pojazdy dostawcze
  {
    id: 'veh-001',
    make: 'Ford',
    model: 'Transit',
    year: 2020,
    licensePlate: 'WA12345',
    vin: 'WF0XXXTTGXKW123456',
    type: 'VAN',
    insuranceExpiry: new Date('2024-08-15'),
    inspectionExpiry: new Date('2024-08-15'),
    purchaseDate: new Date('2020-03-15'),
    purchasePrice: 85000,
    status: 'ACTIVE',
    currentMileage: 84500,
    lastOilChangeMileage: 80000,
    lastTransOilChangeMileage: 50000,
    engineOilInterval: 15000,
    transOilInterval: 40000,
    tireRotationInterval: 20000,
    lastTireRotationMileage: 80000,
    generalServiceInterval: 30000,
    lastGeneralServiceMileage: 80000,
    photoUrl: null,
    location: 'Warszawa - Mokotów',
    isActive: true,
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 5000,
        lastServiceMileage: 45160,
        nextDueMileage: 50160,
        remainingKm: 2580,
        nextDueDate: '2024-03-15',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 25000,
        lastServiceMileage: 25000,
        nextDueMileage: 50000,
        remainingKm: 2420,
        nextDueDate: '2024-06-01',
        status: 'upcoming'
      },
      technicalInspection: {
        lastInspectionDate: '2023-08-15',
        nextDueDate: '2024-08-15',
        daysRemaining: 45,
        status: 'upcoming'
      }
    },
    upcomingServices: [
      {
        id: 'us-001',
        vehicleId: 'veh-001',
        vehicleInfo: {
          make: 'Ford',
          model: 'Transit',
          year: 2020,
          licensePlate: 'WA12345'
        },
        type: 'ENGINE_OIL',
        dueIn: '2580 km',
        urgency: 'upcoming',
        estimatedCost: 150,
        description: 'Wymiana oleju silnikowego i filtra',
        nextDueDate: new Date('2024-03-15'),
        currentMileage: 47580,
        targetMileage: 50160
      },
      {
        id: 'us-002',
        vehicleId: 'veh-001',
        vehicleInfo: {
          make: 'Ford',
          model: 'Transit',
          year: 2020,
          licensePlate: 'WA12345'
        },
        type: 'TECHNICAL_INSPECTION',
        dueIn: '45 dni',
        urgency: 'upcoming',
        estimatedCost: 100,
        description: 'Przegląd techniczny',
        nextDueDate: new Date('2024-08-15')
      }
    ],
    serviceHistory: [
      {
        id: 'sh-001',
        vehicleId: 'veh-001',
        type: 'ENGINE_OIL',
        date: new Date('2024-01-15'),
        mileage: 45160,
        cost: 145,
        provider: 'AutoService Plus',
        details: {
          oilType: '5W-30',
          quantity: 6,
          filterChanged: true
        },
        invoiceNumber: 'INV-2024-001',
        notes: 'Rutynowa wymiana oleju',
        nextDueDate: new Date('2024-03-15'),
        nextDueMileage: 50160
      },
      {
        id: 'sh-002',
        vehicleId: 'veh-001',
        type: 'TRANSMISSION_OIL',
        date: new Date('2023-06-10'),
        mileage: 25000,
        cost: 280,
        provider: 'AutoService Plus',
        details: {
          oilType: 'ATF',
          quantity: 4,
          filterChanged: true
        },
        invoiceNumber: 'INV-2023-045',
        nextDueDate: new Date('2024-06-01'),
        nextDueMileage: 50000
      }
    ],
    activeRepairs: [
      {
        id: 'ar-001',
        status: 'IN_PROGRESS',
        description: 'Naprawa klimatyzacji - wymiana sprężarki',
        dropOffDate: '2024-01-20',
        estimatedCompletion: '2024-01-25',
        serviceProvider: 'Klimat-Auto',
        estimatedCost: 450,
        contactPerson: 'Jan Serwisant',
        repairItems: ['Sprężarka klimatyzacji', 'Gaz chłodniczy', 'Uszczelki']
      }
    ],
    assignments: [
      {
        id: 'ass-001',
        userId: 'emp-001',
        vehicleId: 'veh-001',
        startDate: new Date('2024-01-15'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-001',
          name: 'Jan Kowalski',
          email: 'jan.kowalski@firma.pl',
          position: 'Kierownik budowy'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 3,
      totalServiceCosts: 725,
      lastServiceDate: new Date('2024-01-15'),
      nextServiceDue: new Date('2024-03-15'),
      averageServiceCost: 242,
      maintenanceCompliance: 85
    }
  },
  // Pojazd 2 - Volkswagen Crafter (dostawczy)
  {
    id: 'veh-002',
    make: 'Volkswagen',
    model: 'Crafter',
    year: 2021,
    licensePlate: 'WA67890',
    vin: 'WV1ZZZTGZLX234567',
    type: 'VAN',
    insuranceExpiry: new Date('2024-09-20'),
    inspectionExpiry: new Date('2024-09-20'),
    purchaseDate: new Date('2021-05-10'),
    purchasePrice: 95000,
    status: 'ACTIVE',
    currentMileage: 62100,
    lastOilChangeMileage: 50000,
    lastTransOilChangeMileage: 30000,
    engineOilInterval: 15000,
    transOilInterval: 40000,
    tireRotationInterval: 20000,
    lastTireRotationMileage: 60000,
    generalServiceInterval: 30000,
    lastGeneralServiceMileage: 60000,
    photoUrl: null,
    location: 'Warszawa - Centrum',
    isActive: true,
    createdAt: new Date('2021-05-10'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 15000,
        lastServiceMileage: 50000,
        nextDueMileage: 65000,
        remainingKm: 2900,
        nextDueDate: '2024-02-28',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 40000,
        lastServiceMileage: 30000,
        nextDueMileage: 70000,
        remainingKm: 7900,
        nextDueDate: '2024-08-01',
        status: 'ok'
      },
      technicalInspection: {
        lastInspectionDate: '2023-09-20',
        nextDueDate: '2024-09-20',
        daysRemaining: 80,
        status: 'ok'
      }
    },
    upcomingServices: [
      {
        id: 'us-002',
        vehicleId: 'veh-002',
        vehicleInfo: {
          make: 'Volkswagen',
          model: 'Crafter',
          year: 2021,
          licensePlate: 'WA67890'
        },
        type: 'ENGINE_OIL',
        dueIn: '2900 km',
        urgency: 'upcoming',
        estimatedCost: 180,
        description: 'Wymiana oleju silnikowego i filtra',
        nextDueDate: new Date('2024-02-28'),
        nextDueMileage: 65000
      }
    ],
    serviceHistory: [
      {
        id: 'sh-003',
        vehicleId: 'veh-002',
        type: 'ENGINE_OIL',
        date: new Date('2023-12-10'),
        mileage: 50000,
        cost: 175,
        provider: 'AutoService Plus',
        details: {
          oilType: '5W-30',
          quantity: 7,
          filterChanged: true
        },
        invoiceNumber: 'INV-2023-089',
        notes: 'Rutynowa wymiana oleju - pojazd dostawczy',
        nextDueDate: new Date('2024-02-28'),
        nextDueMileage: 65000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-002',
        userId: 'emp-002',
        vehicleId: 'veh-002',
        startDate: new Date('2024-01-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-002',
          name: 'Anna Nowak',
          email: 'anna.nowak@firma.pl',
          position: 'Kierownik logistyki'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 2,
      totalServiceCosts: 355,
      lastServiceDate: new Date('2023-12-10'),
      nextServiceDue: new Date('2024-02-28'),
      averageServiceCost: 178,
      maintenanceCompliance: 90
    }
  },
  // Pojazd 3 - Mercedes Sprinter (dostawczy)
  {
    id: 'veh-003',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2019,
    licensePlate: 'WA11111',
    vin: 'WDB9066321X123456',
    type: 'VAN',
    insuranceExpiry: new Date('2024-07-15'),
    inspectionExpiry: new Date('2024-07-15'),
    purchaseDate: new Date('2019-03-20'),
    purchasePrice: 120000,
    status: 'ACTIVE',
    currentMileage: 127500,
    lastOilChangeMileage: 115000,
    lastTransOilChangeMileage: 80000,
    engineOilInterval: 15000,
    transOilInterval: 40000,
    tireRotationInterval: 20000,
    lastTireRotationMileage: 120000,
    generalServiceInterval: 30000,
    lastGeneralServiceMileage: 120000,
    photoUrl: null,
    location: 'Warszawa - Praga',
    isActive: true,
    createdAt: new Date('2019-03-20'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 15000,
        lastServiceMileage: 115000,
        nextDueMileage: 130000,
        remainingKm: 2500,
        nextDueDate: '2024-02-15',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 40000,
        lastServiceMileage: 80000,
        nextDueMileage: 120000,
        remainingKm: -7500,
        nextDueDate: '2024-01-01',
        status: 'overdue'
      },
      technicalInspection: {
        lastInspectionDate: '2023-07-15',
        nextDueDate: '2024-07-15',
        daysRemaining: 30,
        status: 'upcoming'
      }
    },
    upcomingServices: [
      {
        id: 'us-003',
        vehicleId: 'veh-003',
        vehicleInfo: {
          make: 'Mercedes',
          model: 'Sprinter',
          year: 2019,
          licensePlate: 'WA11111'
        },
        type: 'ENGINE_OIL',
        dueIn: '2500 km',
        urgency: 'upcoming',
        estimatedCost: 200,
        description: 'Wymiana oleju silnikowego i filtra',
        nextDueDate: new Date('2024-02-15'),
        nextDueMileage: 130000
      },
      {
        id: 'us-004',
        vehicleId: 'veh-003',
        vehicleInfo: {
          make: 'Mercedes',
          model: 'Sprinter',
          year: 2019,
          licensePlate: 'WA11111'
        },
        type: 'TRANSMISSION_OIL',
        dueIn: 'Przeterminowane o 7500 km',
        urgency: 'critical',
        estimatedCost: 400,
        description: 'PILNE: Wymiana oleju przekładniowego',
        nextDueDate: new Date('2024-01-01'),
        nextDueMileage: 120000
      },
      {
        id: 'us-005',
        vehicleId: 'veh-003',
        vehicleInfo: {
          make: 'Mercedes',
          model: 'Sprinter',
          year: 2019,
          licensePlate: 'WA11111'
        },
        type: 'TECHNICAL_INSPECTION',
        dueIn: '30 dni',
        urgency: 'warning',
        estimatedCost: 120,
        description: 'Przegląd techniczny',
        nextDueDate: new Date('2024-07-15'),
        nextDueMileage: null
      }
    ],
    serviceHistory: [
      {
        id: 'sh-004',
        vehicleId: 'veh-003',
        type: 'ENGINE_OIL',
        date: new Date('2023-11-20'),
        mileage: 115000,
        cost: 195,
        provider: 'Mercedes Serwis',
        details: {
          oilType: '5W-40',
          quantity: 8,
          filterChanged: true
        },
        invoiceNumber: 'MB-2023-156',
        notes: 'Olej oryginalny Mercedes',
        nextDueDate: new Date('2024-02-15'),
        nextDueMileage: 130000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-003',
        userId: 'emp-003',
        vehicleId: 'veh-003',
        startDate: new Date('2023-12-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-003',
          name: 'Piotr Wiśniewski',
          email: 'piotr.wisniewski@firma.pl',
          position: 'Kierownik transportu'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 195,
      lastServiceDate: new Date('2023-11-20'),
      nextServiceDue: new Date('2024-02-15'),
      averageServiceCost: 195,
      maintenanceCompliance: 70
    }
  },
  // Pojazd 4 - Toyota Corolla (osobowy)
  {
    id: 'veh-004',
    make: 'Toyota',
    model: 'Corolla',
    year: 2022,
    licensePlate: 'WA22222',
    vin: 'JTDBR32E430123456',
    type: 'CAR',
    insuranceExpiry: new Date('2024-10-10'),
    inspectionExpiry: new Date('2024-10-10'),
    purchaseDate: new Date('2022-01-15'),
    purchasePrice: 75000,
    status: 'ACTIVE',
    currentMileage: 28500,
    lastOilChangeMileage: 20000,
    lastTransOilChangeMileage: 0,
    engineOilInterval: 10000,
    transOilInterval: 60000,
    tireRotationInterval: 15000,
    lastTireRotationMileage: 25000,
    generalServiceInterval: 20000,
    lastGeneralServiceMileage: 20000,
    photoUrl: null,
    location: 'Warszawa - Wola',
    isActive: true,
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 10000,
        lastServiceMileage: 20000,
        nextDueMileage: 30000,
        remainingKm: 1500,
        nextDueDate: '2024-03-01',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 60000,
        lastServiceMileage: 0,
        nextDueMileage: 60000,
        remainingKm: 31500,
        nextDueDate: '2025-01-01',
        status: 'ok'
      },
      technicalInspection: {
        lastInspectionDate: '2023-10-10',
        nextDueDate: '2024-10-10',
        daysRemaining: 120,
        status: 'ok'
      }
    },
    upcomingServices: [
      {
        id: 'us-006',
        vehicleId: 'veh-004',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Corolla',
          year: 2022,
          licensePlate: 'WA22222'
        },
        type: 'ENGINE_OIL',
        dueIn: '1500 km',
        urgency: 'upcoming',
        estimatedCost: 120,
        description: 'Wymiana oleju silnikowego i filtra',
        nextDueDate: new Date('2024-03-01'),
        nextDueMileage: 30000
      }
    ],
    serviceHistory: [
      {
        id: 'sh-005',
        vehicleId: 'veh-004',
        type: 'ENGINE_OIL',
        date: new Date('2023-09-15'),
        mileage: 20000,
        cost: 115,
        provider: 'Toyota Serwis',
        details: {
          oilType: '0W-20',
          quantity: 4,
          filterChanged: true
        },
        invoiceNumber: 'TOY-2023-078',
        notes: 'Oryginalny olej Toyota',
        nextDueDate: new Date('2024-03-01'),
        nextDueMileage: 30000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-004',
        userId: 'emp-004',
        vehicleId: 'veh-004',
        startDate: new Date('2024-01-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-004',
          name: 'Maria Kowalczyk',
          email: 'maria.kowalczyk@firma.pl',
          position: 'Asystent kierownika'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 115,
      lastServiceDate: new Date('2023-09-15'),
      nextServiceDue: new Date('2024-03-01'),
      averageServiceCost: 115,
      maintenanceCompliance: 95
    }
  },
  // Pojazd 5 - BMW 320d (osobowy)
  {
    id: 'veh-005',
    make: 'BMW',
    model: '320d',
    year: 2020,
    licensePlate: 'WA33333',
    vin: 'WBA8E5105L7123456',
    type: 'CAR',
    insuranceExpiry: new Date('2024-06-30'),
    inspectionExpiry: new Date('2024-06-30'),
    purchaseDate: new Date('2020-06-15'),
    purchasePrice: 135000,
    status: 'ACTIVE',
    currentMileage: 78200,
    lastOilChangeMileage: 70000,
    lastTransOilChangeMileage: 60000,
    engineOilInterval: 10000,
    transOilInterval: 80000,
    tireRotationInterval: 15000,
    lastTireRotationMileage: 75000,
    generalServiceInterval: 20000,
    lastGeneralServiceMileage: 80000,
    photoUrl: null,
    location: 'Warszawa - Mokotów',
    isActive: true,
    createdAt: new Date('2020-06-15'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 10000,
        lastServiceMileage: 70000,
        nextDueMileage: 80000,
        remainingKm: 1800,
        nextDueDate: '2024-02-10',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 80000,
        lastServiceMileage: 60000,
        nextDueMileage: 140000,
        remainingKm: 61800,
        nextDueDate: '2025-06-01',
        status: 'ok'
      },
      technicalInspection: {
        lastInspectionDate: '2023-06-30',
        nextDueDate: '2024-06-30',
        daysRemaining: 15,
        status: 'upcoming'
      }
    },
    upcomingServices: [
      {
        id: 'us-007',
        vehicleId: 'veh-005',
        vehicleInfo: {
          make: 'BMW',
          model: '320d',
          year: 2020,
          licensePlate: 'WA33333'
        },
        type: 'ENGINE_OIL',
        dueIn: '1800 km',
        urgency: 'upcoming',
        estimatedCost: 250,
        description: 'Wymiana oleju silnikowego i filtra - BMW',
        nextDueDate: new Date('2024-02-10'),
        nextDueMileage: 80000
      },
      {
        id: 'us-008',
        vehicleId: 'veh-005',
        vehicleInfo: {
          make: 'BMW',
          model: '320d',
          year: 2020,
          licensePlate: 'WA33333'
        },
        type: 'TECHNICAL_INSPECTION',
        dueIn: '15 dni',
        urgency: 'warning',
        estimatedCost: 110,
        description: 'Przegląd techniczny - pilne',
        nextDueDate: new Date('2024-06-30'),
        nextDueMileage: null
      }
    ],
    serviceHistory: [
      {
        id: 'sh-006',
        vehicleId: 'veh-005',
        type: 'ENGINE_OIL',
        date: new Date('2023-10-05'),
        mileage: 70000,
        cost: 240,
        provider: 'BMW Serwis',
        details: {
          oilType: '5W-30',
          quantity: 5,
          filterChanged: true
        },
        invoiceNumber: 'BMW-2023-167',
        notes: 'Oryginalny olej BMW Longlife',
        nextDueDate: new Date('2024-02-10'),
        nextDueMileage: 80000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-005',
        userId: 'emp-005',
        vehicleId: 'veh-005',
        startDate: new Date('2023-08-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-005',
          name: 'Tomasz Nowacki',
          email: 'tomasz.nowacki@firma.pl',
          position: 'Dyrektor sprzedaży'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 240,
      lastServiceDate: new Date('2023-10-05'),
      nextServiceDue: new Date('2024-02-10'),
      averageServiceCost: 240,
      maintenanceCompliance: 88
    }
  },
  // Pojazd 6 - Audi A4 (osobowy)
  {
    id: 'veh-006',
    make: 'Audi',
    model: 'A4',
    year: 2021,
    licensePlate: 'WA44444',
    vin: 'WAUZZZ8E1MA123456',
    type: 'CAR',
    insuranceExpiry: new Date('2024-08-20'),
    inspectionExpiry: new Date('2024-08-20'),
    purchaseDate: new Date('2021-08-01'),
    purchasePrice: 145000,
    status: 'ACTIVE',
    currentMileage: 42300,
    lastOilChangeMileage: 35000,
    lastTransOilChangeMileage: 0,
    engineOilInterval: 10000,
    transOilInterval: 60000,
    tireRotationInterval: 15000,
    lastTireRotationMileage: 40000,
    generalServiceInterval: 20000,
    lastGeneralServiceMileage: 40000,
    photoUrl: null,
    location: 'Warszawa - Żoliborz',
    isActive: true,
    createdAt: new Date('2021-08-01'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 10000,
        lastServiceMileage: 35000,
        nextDueMileage: 45000,
        remainingKm: 2700,
        nextDueDate: '2024-02-25',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 60000,
        lastServiceMileage: 0,
        nextDueMileage: 60000,
        remainingKm: 17700,
        nextDueDate: '2025-08-01',
        status: 'ok'
      },
      technicalInspection: {
        lastInspectionDate: '2023-08-20',
        nextDueDate: '2024-08-20',
        daysRemaining: 60,
        status: 'ok'
      }
    },
    upcomingServices: [
      {
        id: 'us-009',
        vehicleId: 'veh-006',
        vehicleInfo: {
          make: 'Audi',
          model: 'A4',
          year: 2021,
          licensePlate: 'WA44444'
        },
        type: 'ENGINE_OIL',
        dueIn: '2700 km',
        urgency: 'upcoming',
        estimatedCost: 220,
        description: 'Wymiana oleju silnikowego i filtra - Audi',
        nextDueDate: new Date('2024-02-25'),
        nextDueMileage: 45000
      }
    ],
    serviceHistory: [
      {
        id: 'sh-007',
        vehicleId: 'veh-006',
        type: 'ENGINE_OIL',
        date: new Date('2023-08-10'),
        mileage: 35000,
        cost: 210,
        provider: 'Audi Centrum',
        details: {
          oilType: '5W-30',
          quantity: 4.5,
          filterChanged: true
        },
        invoiceNumber: 'AUD-2023-234',
        notes: 'Longlife Service',
        nextDueDate: new Date('2024-02-25'),
        nextDueMileage: 45000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-006',
        userId: 'emp-006',
        vehicleId: 'veh-006',
        startDate: new Date('2023-11-15'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-006',
          name: 'Katarzyna Lewandowska',
          email: 'katarzyna.lewandowska@firma.pl',
          position: 'Kierownik HR'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 210,
      lastServiceDate: new Date('2023-08-10'),
      nextServiceDue: new Date('2024-02-25'),
      averageServiceCost: 210,
      maintenanceCompliance: 92
    }
  },
  // Pojazd 7 - Skoda Octavia (osobowy)
  {
    id: 'veh-007',
    make: 'Skoda',
    model: 'Octavia',
    year: 2020,
    licensePlate: 'WA55555',
    vin: 'TMBJJ1NZ5L8123456',
    type: 'CAR',
    insuranceExpiry: new Date('2024-05-15'),
    inspectionExpiry: new Date('2024-05-15'),
    purchaseDate: new Date('2020-05-01'),
    purchasePrice: 85000,
    status: 'ACTIVE',
    currentMileage: 68900,
    lastOilChangeMileage: 60000,
    lastTransOilChangeMileage: 40000,
    engineOilInterval: 10000,
    transOilInterval: 60000,
    tireRotationInterval: 15000,
    lastTireRotationMileage: 65000,
    generalServiceInterval: 20000,
    lastGeneralServiceMileage: 60000,
    photoUrl: null,
    location: 'Warszawa - Ursynów',
    isActive: true,
    createdAt: new Date('2020-05-01'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 10000,
        lastServiceMileage: 60000,
        nextDueMileage: 70000,
        remainingKm: 1100,
        nextDueDate: '2024-02-05',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 60000,
        lastServiceMileage: 40000,
        nextDueMileage: 100000,
        remainingKm: 31100,
        nextDueDate: '2025-05-01',
        status: 'ok'
      },
      technicalInspection: {
        lastInspectionDate: '2023-05-15',
        nextDueDate: '2024-05-15',
        daysRemaining: 5,
        status: 'overdue'
      }
    },
    upcomingServices: [
      {
        id: 'us-010',
        vehicleId: 'veh-007',
        vehicleInfo: {
          make: 'Skoda',
          model: 'Octavia',
          year: 2020,
          licensePlate: 'WA55555'
        },
        type: 'ENGINE_OIL',
        dueIn: '1100 km',
        urgency: 'upcoming',
        estimatedCost: 140,
        description: 'Wymiana oleju silnikowego i filtra',
        nextDueDate: new Date('2024-02-05'),
        nextDueMileage: 70000
      },
      {
        id: 'us-011',
        vehicleId: 'veh-007',
        vehicleInfo: {
          make: 'Skoda',
          model: 'Octavia',
          year: 2020,
          licensePlate: 'WA55555'
        },
        type: 'TECHNICAL_INSPECTION',
        dueIn: '5 dni',
        urgency: 'critical',
        estimatedCost: 100,
        description: 'PILNE: Przegląd techniczny wygasa za 5 dni!',
        nextDueDate: new Date('2024-05-15'),
        nextDueMileage: null
      }
    ],
    serviceHistory: [
      {
        id: 'sh-008',
        vehicleId: 'veh-007',
        type: 'ENGINE_OIL',
        date: new Date('2023-07-20'),
        mileage: 60000,
        cost: 135,
        provider: 'Skoda Serwis',
        details: {
          oilType: '5W-30',
          quantity: 4.2,
          filterChanged: true
        },
        invoiceNumber: 'SKO-2023-445',
        notes: 'Service zgodnie z planem',
        nextDueDate: new Date('2024-02-05'),
        nextDueMileage: 70000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-007',
        userId: 'emp-007',
        vehicleId: 'veh-007',
        startDate: new Date('2023-09-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-007',
          name: 'Paweł Zieliński',
          email: 'pawel.zielinski@firma.pl',
          position: 'Specjalista IT'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 135,
      lastServiceDate: new Date('2023-07-20'),
      nextServiceDue: new Date('2024-02-05'),
      averageServiceCost: 135,
      maintenanceCompliance: 85
    }
  },
  // Pojazd 8 - Iveco Daily (dostawczy)
  {
    id: 'veh-008',
    make: 'Iveco',
    model: 'Daily',
    year: 2018,
    licensePlate: 'WA66666',
    vin: 'ZCFC658A605123456',
    type: 'TRUCK',
    insuranceExpiry: new Date('2024-04-10'),
    inspectionExpiry: new Date('2024-04-10'),
    purchaseDate: new Date('2018-04-01'),
    purchasePrice: 110000,
    status: 'ACTIVE',
    currentMileage: 189200,
    lastOilChangeMileage: 175000,
    lastTransOilChangeMileage: 150000,
    engineOilInterval: 15000,
    transOilInterval: 40000,
    tireRotationInterval: 20000,
    lastTireRotationMileage: 180000,
    generalServiceInterval: 30000,
    lastGeneralServiceMileage: 180000,
    photoUrl: null,
    location: 'Warszawa - Bemowo',
    isActive: true,
    createdAt: new Date('2018-04-01'),
    updatedAt: new Date('2024-01-20'),
    deletedAt: null,
    serviceIntervals: {
      engineOil: {
        intervalKm: 15000,
        lastServiceMileage: 175000,
        nextDueMileage: 190000,
        remainingKm: 800,
        nextDueDate: '2024-01-30',
        status: 'upcoming'
      },
      transmissionOil: {
        intervalKm: 40000,
        lastServiceMileage: 150000,
        nextDueMileage: 190000,
        remainingKm: 800,
        nextDueDate: '2024-02-01',
        status: 'upcoming'
      },
      technicalInspection: {
        lastInspectionDate: '2023-04-10',
        nextDueDate: '2024-04-10',
        daysRemaining: -5,
        status: 'overdue'
      }
    },
    upcomingServices: [
      {
        id: 'us-012',
        vehicleId: 'veh-008',
        vehicleInfo: {
          make: 'Iveco',
          model: 'Daily',
          year: 2018,
          licensePlate: 'WA66666'
        },
        type: 'ENGINE_OIL',
        dueIn: '800 km',
        urgency: 'warning',
        estimatedCost: 220,
        description: 'Wymiana oleju silnikowego i filtra - pojazd ciężarowy',
        nextDueDate: new Date('2024-01-30'),
        nextDueMileage: 190000
      },
      {
        id: 'us-013',
        vehicleId: 'veh-008',
        vehicleInfo: {
          make: 'Iveco',
          model: 'Daily',
          year: 2018,
          licensePlate: 'WA66666'
        },
        type: 'TRANSMISSION_OIL',
        dueIn: '800 km',
        urgency: 'warning',
        estimatedCost: 450,
        description: 'Wymiana oleju przekładniowego - pojazd ciężarowy',
        nextDueDate: new Date('2024-02-01'),
        nextDueMileage: 190000
      },
      {
        id: 'us-014',
        vehicleId: 'veh-008',
        vehicleInfo: {
          make: 'Iveco',
          model: 'Daily',
          year: 2018,
          licensePlate: 'WA66666'
        },
        type: 'TECHNICAL_INSPECTION',
        dueIn: 'Przeterminowany o 5 dni',
        urgency: 'critical',
        estimatedCost: 150,
        description: 'PILNE: Przegląd techniczny przeterminowany!',
        nextDueDate: new Date('2024-04-10'),
        nextDueMileage: null
      }
    ],
    serviceHistory: [
      {
        id: 'sh-009',
        vehicleId: 'veh-008',
        type: 'ENGINE_OIL',
        date: new Date('2023-10-15'),
        mileage: 175000,
        cost: 215,
        provider: 'Iveco Serwis',
        details: {
          oilType: '15W-40',
          quantity: 12,
          filterChanged: true
        },
        invoiceNumber: 'IVE-2023-789',
        notes: 'Olej do pojazdów ciężarowych',
        nextDueDate: new Date('2024-01-30'),
        nextDueMileage: 190000
      }
    ],
    activeRepairs: [],
    assignments: [
      {
        id: 'ass-008',
        userId: 'emp-008',
        vehicleId: 'veh-008',
        startDate: new Date('2023-06-01'),
        endDate: null,
        isActive: true,
        user: {
          id: 'emp-008',
          name: 'Marcin Krawczyk',
          email: 'marcin.krawczyk@firma.pl',
          position: 'Kierowca ciężarówki'
        }
      }
    ],
    serviceStats: {
      totalServicesThisYear: 1,
      totalServiceCosts: 215,
      lastServiceDate: new Date('2023-10-15'),
      nextServiceDue: new Date('2024-01-30'),
      averageServiceCost: 215,
      maintenanceCompliance: 75
    }
  }
]

// Helper Functions for Enhanced Service Management
export function calculateServiceUrgencyEnhanced(daysUntilDue: number, kmUntilDue?: number): ServiceUrgency {
  if (daysUntilDue <= 0 || (kmUntilDue !== undefined && kmUntilDue <= 0)) return 'critical'
  if (daysUntilDue <= 7 || (kmUntilDue !== undefined && kmUntilDue <= 500)) return 'warning'
  if (daysUntilDue <= 14 || (kmUntilDue !== undefined && kmUntilDue <= 1000)) return 'upcoming'
  return 'normal'
}

export function formatServiceDueDateEnhanced(dueDate: Date, currentMileage?: number, dueMileage?: number): string {
  const now = new Date()
  const diffTime = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (currentMileage && dueMileage) {
    const kmRemaining = dueMileage - currentMileage
    if (kmRemaining <= 0) return 'Przeterminowany'
    return `Za ${kmRemaining.toLocaleString()} km`
  }
  
  if (diffDays <= 0) return 'Przeterminowany'
  if (diffDays === 1) return 'Jutro'
  if (diffDays <= 7) return `Za ${diffDays} dni`
  
  return dueDate.toLocaleDateString('pl-PL')
}

export function getServiceStatusColorEnhanced(status: ServiceStatusEnhanced): string {
  const colors: Record<ServiceStatusEnhanced, string> = {
    ok: 'green',
    upcoming: 'blue',
    due_soon: 'yellow',
    overdue: 'red'
  }
  return colors[status] || 'gray'
}

export function getServiceUrgencyColorEnhanced(urgency: ServiceUrgency): string {
  const colors: Record<ServiceUrgency, string> = {
    normal: 'blue',
    upcoming: 'blue',
    warning: 'yellow',
    critical: 'red'
  }
  return colors[urgency] || 'gray'
}

export function translateServiceTypeEnhanced(type: EnhancedServiceType): string {
  const translations: Record<EnhancedServiceType, string> = {
    ENGINE_OIL: 'Olej silnikowy',
    TRANSMISSION_OIL: 'Olej przekładniowy',
    TECHNICAL_INSPECTION: 'Przegląd techniczny',
    REPAIR: 'Naprawa'
  }
  return translations[type] || type
}

export function translateServiceStatusEnhanced(status: ServiceStatusEnhanced): string {
  const translations: Record<ServiceStatusEnhanced, string> = {
    ok: 'W porządku',
    upcoming: 'Nadchodzący',
    due_soon: 'Wymaga uwagi',
    overdue: 'Przeterminowany'
  }
  return translations[status] || status
}

export function translateRepairStatusEnhanced(status: RepairStatus): string {
  const translations: Record<RepairStatus, string> = {
    DROPPED_OFF: 'Oddany do serwisu',
    IN_PROGRESS: 'W trakcie naprawy',
    READY_FOR_PICKUP: 'Gotowy do odbioru',
    COMPLETED: 'Zakończony'
  }
  return translations[status] || status
}