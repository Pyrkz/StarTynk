import {
  DeliveryStatus,
  DeliveryType,
  ItemQualityStatus,
  DeliveryPriority
} from '../constants/delivery.constants'
import type {
  DeliveryWithRelations,
  DeliveryListItem,
  DeliveryItemWithRelations,
  DeliveryStats,
  DeliveryCostBreakdown
} from '../types/delivery.types'

// ============== STATUS HELPERS ==============

export const isDeliveryPending = (status: DeliveryStatus): boolean => {
  return status === DeliveryStatus.PENDING
}

export const isDeliveryInProgress = (status: DeliveryStatus): boolean => {
  return ([
    DeliveryStatus.RECEIVED,
    DeliveryStatus.QUALITY_CHECK
  ] as DeliveryStatus[]).includes(status)
}

export const isDeliveryCompleted = (status: DeliveryStatus): boolean => {
  return status === DeliveryStatus.ACCEPTED
}

export const isDeliveryRejected = (status: DeliveryStatus): boolean => {
  return status === DeliveryStatus.REJECTED
}

export const canDeliveryBeEdited = (status: DeliveryStatus): boolean => {
  return status === DeliveryStatus.PENDING
}

export const canDeliveryBeCancelled = (status: DeliveryStatus): boolean => {
  return ([
    DeliveryStatus.PENDING,
    DeliveryStatus.RECEIVED
  ] as DeliveryStatus[]).includes(status)
}

export const getNextValidStatuses = (currentStatus: DeliveryStatus): DeliveryStatus[] => {
  const statusFlow: Record<DeliveryStatus, DeliveryStatus[]> = {
    [DeliveryStatus.PENDING]: [DeliveryStatus.RECEIVED],
    [DeliveryStatus.RECEIVED]: [DeliveryStatus.QUALITY_CHECK, DeliveryStatus.ACCEPTED, DeliveryStatus.REJECTED],
    [DeliveryStatus.QUALITY_CHECK]: [DeliveryStatus.ACCEPTED, DeliveryStatus.REJECTED],
    [DeliveryStatus.ACCEPTED]: [],
    [DeliveryStatus.REJECTED]: []
  }

  return statusFlow[currentStatus] || []
}

// ============== CALCULATION HELPERS ==============

export const calculateDeliveryCompletionRate = (delivery: DeliveryWithRelations): number => {
  if (!delivery.items.length) return 0

  const totalItems = delivery.items.length
  const completedItems = delivery.items.filter(
    (item: DeliveryItemWithRelations) => item.qualityStatus === ItemQualityStatus.APPROVED
  ).length

  return Math.round((completedItems / totalItems) * 100)
}

export const calculateItemAcceptanceRate = (item: DeliveryItemWithRelations): number => {
  const delivered = Number(item.deliveredQuantity)
  const accepted = Number(item.acceptedQuantity || 0)

  if (delivered === 0) return 0
  return Math.round((accepted / delivered) * 100)
}

export const calculateDeliveryTotalValue = (delivery: DeliveryWithRelations): number => {
  if (delivery.totalValue) {
    return Number(delivery.totalValue)
  }

  return delivery.items.reduce((total: number, item: DeliveryItemWithRelations) => {
    const itemValue = Number(item.totalPrice || 0)
    return total + itemValue
  }, 0)
}

export const calculateDeliveryWeight = (delivery: DeliveryWithRelations): number => {
  if (delivery.totalWeight) {
    return Number(delivery.totalWeight)
  }

  // Could calculate from items if they have weight information
  return 0
}

export const calculateItemQuantityVariance = (item: DeliveryItemWithRelations): {
  variance: number
  percentage: number
} => {
  const ordered = Number(item.orderedQuantity)
  const delivered = Number(item.deliveredQuantity)
  const variance = delivered - ordered
  const percentage = ordered > 0 ? Math.round((variance / ordered) * 100) : 0

  return { variance, percentage }
}

// ============== DELIVERY TIME CALCULATIONS ==============

export const calculateDeliveryDuration = (delivery: DeliveryWithRelations): number | null => {
  if (!delivery.arrivalTime || !delivery.completionTime) return null

  const arrival = new Date(delivery.arrivalTime)
  const completion = new Date(delivery.completionTime)
  const durationMs = completion.getTime() - arrival.getTime()

  return Math.round(durationMs / (1000 * 60)) // minutes
}

export const isDeliveryOverdue = (delivery: DeliveryWithRelations): boolean => {
  if (!delivery.scheduledDate) return false

  const now = new Date()
  const scheduled = new Date(delivery.scheduledDate)
  const overdueThresholdHours = 2 // configurable

  const overdueTime = new Date(scheduled.getTime() + (overdueThresholdHours * 60 * 60 * 1000))

  return now > overdueTime && !isDeliveryCompleted(delivery.status)
}

export const getDeliveryDelayInHours = (delivery: DeliveryWithRelations): number => {
  if (!delivery.scheduledDate) return 0

  const now = new Date()
  const scheduled = new Date(delivery.scheduledDate)

  if (now <= scheduled) return 0

  return Math.round((now.getTime() - scheduled.getTime()) / (1000 * 60 * 60))
}

// ============== QUALITY CONTROL HELPERS ==============

export const hasQualityIssues = (delivery: DeliveryWithRelations): boolean => {
  return delivery.items.some((item: DeliveryItemWithRelations) =>
    [ItemQualityStatus.DAMAGED, ItemQualityStatus.DEFECTIVE, ItemQualityStatus.REJECTED]
      .includes(item.qualityStatus)
  )
}

export const getQualityIssueCount = (delivery: DeliveryWithRelations): number => {
  return delivery.items.filter((item: DeliveryItemWithRelations) =>
    [ItemQualityStatus.DAMAGED, ItemQualityStatus.DEFECTIVE, ItemQualityStatus.REJECTED]
      .includes(item.qualityStatus)
  ).length
}

export const calculateQualityScore = (delivery: DeliveryWithRelations): number => {
  if (!delivery.items.length) return 100

  const totalItems = delivery.items.length
  const goodItems = delivery.items.filter((item: DeliveryItemWithRelations) =>
    [ItemQualityStatus.APPROVED, ItemQualityStatus.PARTIALLY_APPROVED]
      .includes(item.qualityStatus)
  ).length

  return Math.round((goodItems / totalItems) * 100)
}

// ============== STATISTICS CALCULATIONS ==============

export const calculateDeliveryStats = (deliveries: DeliveryListItem[]): DeliveryStats => {
  const total = deliveries.length
  const pending = deliveries.filter(d => isDeliveryPending(d.status)).length
  const scheduled = 0 // SCHEDULED status not in current schema
  const completed = deliveries.filter(d => isDeliveryCompleted(d.status)).length

  const totalValue = deliveries.reduce((sum, d) => sum + Number(d.totalValue || 0), 0)

  // Calculate average delivery time for completed deliveries
  const completedWithTimes = deliveries.filter(d => 
    isDeliveryCompleted(d.status) && d.deliveryDate
  )
  const averageDeliveryTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum, d) => {
        // This would need arrival and completion times to calculate properly
        return sum + 4 // placeholder: 4 hours average
      }, 0) / completedWithTimes.length
    : 0

  return {
    totalDeliveries: total,
    pendingDeliveries: pending,
    scheduledDeliveries: scheduled,
    completedDeliveries: completed,
    totalValue,
    averageDeliveryTime,
    qualityIssueRate: 0, // Would need item-level data
    onTimeDeliveryRate: 85 // Placeholder
  }
}

// ============== COST CALCULATIONS ==============

export const calculateDeliveryCostBreakdown = (
  delivery: DeliveryWithRelations
): DeliveryCostBreakdown => {
  const materialCosts = delivery.items.reduce((sum: number, item: DeliveryItemWithRelations) => 
    sum + Number(item.totalPrice || 0), 0
  )
  const deliveryFees = Number(delivery.deliveryCost || 0)
  const handlingCharges = 0 // Could be calculated based on type/weight
  const storageCharges = 0 // Could be calculated based on storage duration
  const totalLandedCost = materialCosts + deliveryFees + handlingCharges + storageCharges

  return {
    materialCosts,
    deliveryFees,
    handlingCharges,
    storageCharges,
    totalLandedCost,
    currency: delivery.currency || 'PLN',
    projectAllocation: delivery.projectId ? [{
      projectId: delivery.projectId,
      projectName: delivery.project?.name || 'Unknown',
      allocatedAmount: totalLandedCost,
      percentage: 100
    }] : undefined
  }
}

// ============== FORMATTING HELPERS ==============

export const formatDeliveryNumber = (id: string): string => {
  // Convert UUID to human-readable delivery number
  const shortId = id.slice(-8).toUpperCase()
  return `DOS-${shortId}`
}

export const formatWeight = (weight: number | null, unit = 'kg'): string => {
  if (!weight) return '-'
  
  if (weight >= 1000 && unit === 'kg') {
    return `${(weight / 1000).toFixed(1)} t`
  }
  
  return `${weight.toFixed(1)} ${unit}`
}

export const formatVolume = (volume: number | null, unit = 'm³'): string => {
  if (!volume) return '-'
  return `${volume.toFixed(2)} ${unit}`
}

export const formatCurrency = (amount: number | null, currency = 'PLN'): string => {
  if (!amount) return '-'
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDeliveryDuration = (minutes: number | null): string => {
  if (!minutes) return '-'
  
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}min`
}

// ============== SORTING HELPERS ==============

export const sortDeliveriesByPriority = (
  a: DeliveryListItem,
  b: DeliveryListItem
): number => {
  const priorityOrder: Record<DeliveryPriority, number> = {
    [DeliveryPriority.CRITICAL]: 5,
    [DeliveryPriority.URGENT]: 4,
    [DeliveryPriority.HIGH]: 3,
    [DeliveryPriority.NORMAL]: 2,
    [DeliveryPriority.LOW]: 1
  }

  // Would need priority field in DeliveryListItem to implement this
  return 0
}

export const sortDeliveriesByDate = (
  a: DeliveryListItem,
  b: DeliveryListItem,
  direction: 'asc' | 'desc' = 'desc'
): number => {
  const dateA = new Date(a.deliveryDate).getTime()
  const dateB = new Date(b.deliveryDate).getTime()
  
  return direction === 'asc' ? dateA - dateB : dateB - dateA
}

export const sortDeliveriesByValue = (
  a: DeliveryListItem,
  b: DeliveryListItem,
  direction: 'asc' | 'desc' = 'desc'
): number => {
  const valueA = Number(a.totalValue || 0)
  const valueB = Number(b.totalValue || 0)
  
  return direction === 'asc' ? valueA - valueB : valueB - valueA
}

// ============== VALIDATION HELPERS ==============

export const validateDeliveryItem = (item: {
  orderedQuantity: number
  deliveredQuantity: number
  acceptedQuantity?: number
  rejectedQuantity?: number
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (item.orderedQuantity <= 0) {
    errors.push('Zamówiona ilość musi być większa od 0')
  }

  if (item.deliveredQuantity < 0) {
    errors.push('Dostarczona ilość nie może być ujemna')
  }

  if (item.acceptedQuantity !== undefined && item.acceptedQuantity < 0) {
    errors.push('Przyjęta ilość nie może być ujemna')
  }

  if (item.rejectedQuantity !== undefined && item.rejectedQuantity < 0) {
    errors.push('Odrzucona ilość nie może być ujemna')
  }

  const totalProcessed = (item.acceptedQuantity || 0) + (item.rejectedQuantity || 0)
  if (totalProcessed > item.deliveredQuantity) {
    errors.push('Suma przyjętej i odrzuconej ilości nie może przekraczać dostarczonej ilości')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============== SEARCH HELPERS ==============

export const searchDeliveries = (
  deliveries: DeliveryListItem[],
  searchTerm: string
): DeliveryListItem[] => {
  if (!searchTerm.trim()) return deliveries

  const term = searchTerm.toLowerCase()

  return deliveries.filter(delivery => 
    delivery.supplierName.toLowerCase().includes(term) ||
    delivery.project?.name?.toLowerCase().includes(term) ||
    delivery.project?.address?.toLowerCase().includes(term) ||
    formatDeliveryNumber(delivery.id).toLowerCase().includes(term)
  )
}

// ============== EXPORT HELPERS ==============

export const prepareDeliveryForExport = (delivery: DeliveryWithRelations) => {
  return {
    'Numer dostawy': formatDeliveryNumber(delivery.id),
    'Dostawca': delivery.supplierName,
    'Projekt': delivery.project?.name || '-',
    'Data dostawy': new Date(delivery.deliveryDate).toLocaleDateString('pl-PL'),
    'Status': delivery.status,
    'Typ dostawy': delivery.deliveryType,
    'Wartość': formatCurrency(Number(delivery.totalValue || 0)),
    'Waga': formatWeight(Number(delivery.totalWeight || 0)),
    'Liczba pozycji': delivery.items.length,
    'Jakość': `${calculateQualityScore(delivery)}%`,
    'Odbiorca': delivery.receivedBy.name
  }
}