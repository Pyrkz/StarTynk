import {
  DeliveryStatus,
  DeliveryType,
  ItemQualityStatus,
  DeliveryPhotoType,
  DeliveryPriority
} from '../constants/delivery.constants'

// ============== PRISMA MODEL TYPES ==============

export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string | null
  address?: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  description?: string | null
  unit: string
  categoryId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DeliverySchedule {
  id: string
  deliveryId: string
  scheduledDate: Date
  timeSlot?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DeliveryPhoto {
  id: string
  deliveryId: string
  photoType: DeliveryPhotoType
  url: string
  description?: string | null
  uploadedAt: Date
}

export interface DeliveryItem {
  id: string
  deliveryId: string
  materialId?: string | null
  itemName: string
  orderedQuantity: number
  deliveredQuantity: number
  acceptedQuantity?: number | null
  rejectedQuantity?: number | null
  unit: string
  unitPrice?: number | null
  totalPrice?: number | null
  qualityStatus: ItemQualityStatus
  qualityNotes?: string | null
  qualityCheckDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Delivery {
  id: string
  projectId?: string | null
  supplierName: string
  supplierContact?: string | null
  deliveryDate: Date
  scheduledDate?: Date | null
  deliveryType: DeliveryType
  status: DeliveryStatus
  priority: DeliveryPriority
  
  // Driver and Vehicle Information
  driverName?: string | null
  driverPhone?: string | null
  vehiclePlate?: string | null
  vehicleType?: string | null
  
  // Quantities and Measurements
  totalWeight?: number | null
  totalVolume?: number | null
  palletCount?: number | null
  packageCount?: number | null
  
  // Delivery Details
  arrivalTime?: Date | null
  completionTime?: Date | null
  deliveryAddress?: string | null
  notes?: string | null
  internalNotes?: string | null
  
  // Documentation
  deliveryNoteNumber?: string | null
  invoiceNumber?: string | null
  
  // Cost Information
  deliveryCost?: number | null
  totalValue?: number | null
  currency?: string | null
  
  // Quality Control
  qualityCheckRequired?: boolean | null
  qualityNotes?: string | null
  
  // Storage and Location
  storageLocation?: string | null
  warehouseSection?: string | null
  
  // User Relations
  receivedById: string
  qualityCheckById?: string | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// ============== BASE TYPES ==============

export type DeliveryWithRelations = Delivery & {
  project?: Project | null
  receivedBy: User
  qualityCheckBy?: User | null
  items: DeliveryItemWithRelations[]
  photos: DeliveryPhoto[]
  schedule?: DeliverySchedule | null
  _count?: {
    items: number
    photos: number
  }
}

export type DeliveryItemWithRelations = DeliveryItem & {
  delivery: Delivery
  material?: Material | null
}

export type DeliveryListItem = Pick<
  Delivery,
  | 'id'
  | 'supplierName'
  | 'deliveryDate'
  | 'status'
  | 'deliveryType'
  | 'totalWeight'
  | 'totalValue'
  | 'palletCount'
  | 'packageCount'
> & {
  project?: Pick<Project, 'id' | 'name' | 'address'> | null
  receivedBy: Pick<User, 'id' | 'name'>
  _count: {
    items: number
    photos: number
  }
}

// ============== FORM INPUT TYPES ==============

export interface CreateDeliveryInput {
  projectId?: string
  supplierName: string
  supplierContact?: string
  deliveryDate: Date
  scheduledDate?: Date
  deliveryType: DeliveryType
  
  // Driver and Vehicle Information
  driverName?: string
  driverPhone?: string
  vehiclePlate?: string
  vehicleType?: string
  
  // Quantities and Measurements
  totalWeight?: number
  totalVolume?: number
  palletCount?: number
  packageCount?: number
  
  // Delivery Details
  deliveryAddress?: string
  notes?: string
  internalNotes?: string
  
  // Documentation
  deliveryNoteNumber?: string
  invoiceNumber?: string
  
  // Cost Information
  deliveryCost?: number
  totalValue?: number
  currency?: string
  
  // Quality Control
  qualityCheckRequired?: boolean
  qualityNotes?: string
  
  // Storage and Location
  storageLocation?: string
  warehouseSection?: string
  
  // Items
  items: CreateDeliveryItemInput[]
  
  // Scheduling (if creating with schedule)
  schedule?: CreateDeliveryScheduleInput
}

export interface CreateDeliveryItemInput {
  materialId?: string
  itemName: string
  itemDescription?: string
  category?: string
  unit: string
  orderedQuantity: number
  deliveredQuantity: number
  unitPrice?: number
  storageLocation?: string
  batchNumber?: string
  expiryDate?: Date
  notes?: string
}

export interface CreateDeliveryScheduleInput {
  requestedDate: Date
  confirmedDate?: Date
  timeSlot?: string
  priority: DeliveryPriority
  estimatedDuration?: number
  specialRequirements?: string
  accessInstructions?: string
  contactPerson?: string
  contactPhone?: string
}

export interface UpdateDeliveryInput extends Partial<CreateDeliveryInput> {
  status?: DeliveryStatus
  arrivalTime?: Date
  completionTime?: Date
  qualityCheckCompleted?: boolean
  qualityCheckById?: string
  qualityCheckDate?: Date
  qualityNotes?: string
}

export interface UpdateDeliveryItemInput extends Partial<CreateDeliveryItemInput> {
  acceptedQuantity?: number
  rejectedQuantity?: number
  qualityStatus?: ItemQualityStatus
  damageDescription?: string
  qualityNotes?: string
}

// ============== FILTERING & SEARCH ==============

export interface DeliveryFiltersInput {
  search?: string
  status?: DeliveryStatus | 'ALL'
  deliveryType?: DeliveryType | 'ALL'
  projectId?: string
  supplierName?: string
  dateRange?: {
    from: Date
    to: Date
  }
  qualityCheckRequired?: boolean
  qualityCheckCompleted?: boolean
  priorityLevel?: DeliveryPriority
}

export interface DeliveryItemFilters {
  search?: string
  qualityStatus?: ItemQualityStatus | 'ALL'
  materialId?: string
  category?: string
  storageLocation?: string
  hasQualityIssues?: boolean
}

// ============== STATISTICS & ANALYTICS ==============

export interface DeliveryStats {
  totalDeliveries: number
  pendingDeliveries: number
  scheduledDeliveries: number
  completedDeliveries: number
  totalValue: number
  averageDeliveryTime: number // in hours
  qualityIssueRate: number // percentage
  onTimeDeliveryRate: number // percentage
}

export interface DeliveryPerformanceMetrics {
  supplierPerformance: Array<{
    supplierName: string
    totalDeliveries: number
    onTimeRate: number
    qualityScore: number
    averageCost: number
  }>
  monthlyTrends: Array<{
    month: string
    deliveries: number
    value: number
    qualityIssues: number
  }>
  deliveryTypeBreakdown: Array<{
    type: DeliveryType
    count: number
    percentage: number
  }>
}

// ============== PHOTO MANAGEMENT ==============

export interface DeliveryPhotoUpload {
  file: File
  description?: string
  photoType: DeliveryPhotoType
}

export interface DeliveryPhotoMetadata {
  id: string
  url: string
  filename: string
  fileSize?: number
  mimeType?: string
  description?: string
  photoType: DeliveryPhotoType
  takenAt: Date
  takenBy?: string
}

// ============== QUALITY CONTROL ==============

export interface QualityControlAssessment {
  deliveryId: string
  overallStatus: 'APPROVED' | 'REJECTED' | 'PARTIALLY_APPROVED'
  inspector: string
  inspectionDate: Date
  notes?: string
  itemAssessments: Array<{
    itemId: string
    status: ItemQualityStatus
    acceptedQuantity?: number
    rejectedQuantity?: number
    damageDescription?: string
    notes?: string
  }>
  photos: string[] // Photo IDs
}

// ============== SCHEDULING ==============

export interface DeliveryTimeSlot {
  id: string
  label: string
  startTime: string // "08:00"
  endTime: string // "12:00"
  maxDeliveries: number
  currentBookings: number
  available: boolean
}

export interface DeliveryCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  deliveryId: string
  status: DeliveryStatus
  priority: DeliveryPriority
  supplierName: string
  deliveryType: DeliveryType
  notes?: string
}

// ============== WAREHOUSE INTEGRATION ==============

export interface WarehouseLocation {
  id: string
  section: string
  aisle?: string
  shelf?: string
  capacity: number
  currentLoad: number
  available: boolean
  itemTypes: string[]
}

export interface StockMovement {
  deliveryItemId: string
  fromLocation?: string
  toLocation: string
  quantity: number
  movementType: 'RECEIPT' | 'TRANSFER' | 'ADJUSTMENT'
  movementDate: Date
  notes?: string
}

// ============== COST TRACKING ==============

export interface DeliveryCostBreakdown {
  materialCosts: number
  deliveryFees: number
  handlingCharges: number
  storageCharges: number
  totalLandedCost: number
  currency: string
  projectAllocation?: Array<{
    projectId: string
    projectName: string
    allocatedAmount: number
    percentage: number
  }>
}

// ============== INTEGRATION TYPES ==============

export interface MaterialOrderIntegration {
  orderId: string
  orderNumber: string
  orderDate: Date
  expectedItems: Array<{
    materialId: string
    materialName: string
    orderedQuantity: number
    unitPrice: number
  }>
  partialDeliveries: string[] // Delivery IDs
  remainingQuantities: Array<{
    materialId: string
    remainingQuantity: number
  }>
}

export interface ProjectIntegration {
  projectId: string
  projectName: string
  projectAddress: string
  coordinator?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  budgetImpact: {
    allocatedBudget: number
    spentAmount: number
    pendingAmount: number
    remainingBudget: number
  }
}

// ============== API RESPONSE TYPES ==============

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DeliveryListResponse {
  deliveries: DeliveryListItem[]
  pagination: PaginationData
  filters: DeliveryFiltersInput
}

export interface DeliveryDetailResponse {
  delivery: DeliveryWithRelations
  materialOrder?: MaterialOrderIntegration
  projectIntegration?: ProjectIntegration
  costBreakdown: DeliveryCostBreakdown
  relatedDeliveries: DeliveryListItem[]
}

// ============== FORM VALIDATION ==============

export interface DeliveryFormErrors {
  supplierName?: string
  deliveryDate?: string
  deliveryType?: string
  items?: Array<{
    itemName?: string
    unit?: string
    orderedQuantity?: string
    deliveredQuantity?: string
  }>
  schedule?: {
    requestedDate?: string
    timeSlot?: string
  }
}

// ============== UTILITY TYPES ==============

export type DeliveryStatusColor = {
  [K in DeliveryStatus]: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
}

export type DeliveryTypeIcon = {
  [K in DeliveryType]: string // Lucide icon name
}

export type ItemQualityStatusColor = {
  [K in ItemQualityStatus]: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
}