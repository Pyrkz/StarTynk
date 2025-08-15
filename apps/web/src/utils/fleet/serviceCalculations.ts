import type {
  ServiceStatusEnhanced,
  ServiceUrgency,
  UpcomingServiceEnhanced,
  ServiceDeadlineDataEnhanced,
  VehicleWithServicesEnhanced,
  ServiceStatisticsEnhanced,
  EnhancedServiceType
} from '@/types/fleet-enhanced'

// Service calculation utilities for fleet management

export const calculateServiceStatus = (
  currentValue: number,
  targetValue: number,
  isDistanceBased: boolean = true
): { status: ServiceStatusEnhanced; urgency: ServiceUrgency; remaining: number } => {
  const remaining = targetValue - currentValue
  const usagePercentage = (currentValue / targetValue) * 100

  let status: ServiceStatusEnhanced = 'ok'
  let urgency: ServiceUrgency = 'normal'

  if (remaining <= 0) {
    status = 'overdue'
    urgency = 'critical'
  } else if (isDistanceBased) {
    // Distance-based thresholds (km)
    if (remaining <= 250) {
      status = 'due_soon'
      urgency = 'critical'
    } else if (remaining <= 500) {
      status = 'due_soon'
      urgency = 'warning'
    } else if (remaining <= 1000) {
      status = 'upcoming'
      urgency = 'upcoming'
    }
  } else {
    // Time-based thresholds (days)
    if (remaining <= 7) {
      status = 'due_soon'
      urgency = 'critical'
    } else if (remaining <= 14) {
      status = 'due_soon'
      urgency = 'warning'
    } else if (remaining <= 30) {
      status = 'upcoming'
      urgency = 'upcoming'
    }
  }

  return { status, urgency, remaining: Math.max(0, remaining) }
}

export const calculateDateBasedServiceStatus = (
  dueDate: Date,
  currentDate: Date = new Date()
): { status: ServiceStatusEnhanced; urgency: ServiceUrgency; daysRemaining: number } => {
  const msPerDay = 24 * 60 * 60 * 1000
  const daysRemaining = Math.floor((dueDate.getTime() - currentDate.getTime()) / msPerDay)

  const { status, urgency } = calculateServiceStatus(
    Math.abs(daysRemaining), 
    0, 
    false
  )

  return { 
    status: daysRemaining < 0 ? 'overdue' : status, 
    urgency: daysRemaining < 0 ? 'critical' : urgency, 
    daysRemaining 
  }
}

export const generateServiceDeadlineData = (
  vehicles: VehicleWithServicesEnhanced[]
): ServiceDeadlineDataEnhanced => {
  const allServices: UpcomingServiceEnhanced[] = []
  
  vehicles.forEach(vehicle => {
    allServices.push(...vehicle.upcomingServices)
  })

  const overdue = allServices.filter(service => service.urgency === 'critical' && 
    (service.dueIn.includes('Przeterminowany') || service.dueIn.includes('-')))
    
  const dueSoon = allServices.filter(service => 
    service.urgency === 'warning' || 
    (service.urgency === 'critical' && !service.dueIn.includes('Przeterminowany'))
  )
  
  const upcoming = allServices.filter(service => 
    service.urgency === 'upcoming' || service.urgency === 'normal'
  )

  return {
    overdue,
    dueSoon,
    upcoming,
    totalCount: allServices.length,
    criticalCount: overdue.length,
    warningCount: dueSoon.length,
    upcomingCount: upcoming.length
  }
}

export const calculateServiceStatistics = (
  vehicles: VehicleWithServicesEnhanced[]
): ServiceStatisticsEnhanced => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  let servicesThisMonth = 0
  let totalServiceCosts = 0
  let upcomingServices = 0
  let overdueServices = 0
  let totalActiveRepairs = 0
  
  const serviceTypeCounts: Record<EnhancedServiceType, number> = {
    ENGINE_OIL: 0,
    TRANSMISSION_OIL: 0,
    TECHNICAL_INSPECTION: 0,
    REPAIR: 0
  }

  const providerStats: Record<string, { count: number; totalCost: number; ratings: number[] }> = {}

  vehicles.forEach(vehicle => {
    // Count services this month
    vehicle.serviceHistory.forEach(service => {
      const serviceDate = new Date(service.date)
      if (serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear) {
        servicesThisMonth++
        totalServiceCosts += service.cost
        serviceTypeCounts[service.type]++
        
        // Track provider stats
        if (!providerStats[service.provider]) {
          providerStats[service.provider] = { count: 0, totalCost: 0, ratings: [] }
        }
        providerStats[service.provider].count++
        providerStats[service.provider].totalCost += service.cost
      }
    })

    // Count upcoming and overdue services
    vehicle.upcomingServices.forEach(service => {
      if (service.urgency === 'critical') {
        overdueServices++
      } else {
        upcomingServices++
      }
    })

    // Count active repairs
    totalActiveRepairs += vehicle.activeRepairs.length

    // Add total service costs for the year
    totalServiceCosts += vehicle.serviceStats.totalServiceCosts
  })

  // Find most common service type
  const mostCommonServiceType = Object.entries(serviceTypeCounts)
    .reduce((a, b) => serviceTypeCounts[a[0] as EnhancedServiceType] > serviceTypeCounts[b[0] as EnhancedServiceType] ? a : b)[0] as EnhancedServiceType

  // Calculate service compliance rate
  const vehiclesUpToDate = vehicles.filter(vehicle => 
    vehicle.upcomingServices.every(service => service.urgency !== 'critical')
  ).length
  const serviceComplianceRate = vehicles.length > 0 ? (vehiclesUpToDate / vehicles.length) * 100 : 100

  // Calculate top service providers
  const topServiceProviders = Object.entries(providerStats)
    .map(([name, stats]) => ({
      name,
      serviceCount: stats.count,
      averageCost: stats.totalCost / stats.count,
      rating: stats.ratings.length > 0 ? stats.ratings.reduce((a, b) => a + b) / stats.ratings.length : 4.5
    }))
    .sort((a, b) => b.serviceCount - a.serviceCount)
    .slice(0, 5)

  return {
    totalVehicles: vehicles.length,
    servicesThisMonth,
    upcomingServices,
    overdueServices,
    totalServiceCosts,
    averageCostPerVehicle: vehicles.length > 0 ? totalServiceCosts / vehicles.length : 0,
    mostCommonServiceType,
    totalActiveRepairs,
    serviceComplianceRate,
    costTrend: 0, // Would be calculated based on historical data
    topServiceProviders
  }
}

export const estimateNextServiceDate = (
  lastServiceMileage: number,
  currentMileage: number,
  intervalMileage: number,
  averageMonthlyMileage: number = 1500
): Date => {
  const remainingMileage = intervalMileage - (currentMileage - lastServiceMileage)
  const estimatedMonths = Math.max(0, remainingMileage / averageMonthlyMileage)
  
  const nextServiceDate = new Date()
  nextServiceDate.setMonth(nextServiceDate.getMonth() + estimatedMonths)
  
  return nextServiceDate
}

export const calculateServiceCostTrend = (
  currentMonthCosts: number,
  previousMonthCosts: number
): number => {
  if (previousMonthCosts === 0) return 0
  return ((currentMonthCosts - previousMonthCosts) / previousMonthCosts) * 100
}

export const getServicePriorityScore = (service: UpcomingServiceEnhanced): number => {
  const urgencyScores = {
    critical: 4,
    warning: 3,
    upcoming: 2,
    normal: 1
  }
  
  const typeScores = {
    ENGINE_OIL: 3,
    TRANSMISSION_OIL: 2,
    TECHNICAL_INSPECTION: 4,
    REPAIR: 4
  }
  
  return urgencyScores[service.urgency] * typeScores[service.type]
}

export const sortServicesByPriority = (
  services: UpcomingServiceEnhanced[]
): UpcomingServiceEnhanced[] => {
  return [...services].sort((a, b) => {
    const scoreA = getServicePriorityScore(a)
    const scoreB = getServicePriorityScore(b)
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA // Higher priority first
    }
    
    // If same priority, sort by due date
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
  })
}

export const formatServiceInterval = (
  intervalKm: number,
  remainingKm: number,
  unit: 'km' | 'days' = 'km'
): string => {
  if (unit === 'km') {
    if (remainingKm <= 0) return 'Przeterminowany'
    return `Za ${remainingKm.toLocaleString()} km`
  } else {
    if (remainingKm <= 0) return 'Przeterminowany'
    if (remainingKm === 1) return 'Za 1 dzień'
    return `Za ${remainingKm} dni`
  }
}

export const calculateMaintenanceCompliance = (
  vehicle: VehicleWithServicesEnhanced
): number => {
  const totalServices = Object.keys(vehicle.serviceIntervals).length
  const upToDateServices = Object.values(vehicle.serviceIntervals)
    .filter(interval => interval.status === 'ok' || interval.status === 'upcoming').length
  
  return totalServices > 0 ? (upToDateServices / totalServices) * 100 : 100
}

export const generateServiceReminder = (
  service: UpcomingServiceEnhanced,
  reminderType: 'email' | 'sms' | 'notification' = 'notification'
): string => {
  const vehicle = `${service.vehicleInfo.make} ${service.vehicleInfo.model} (${service.vehicleInfo.licensePlate})`
  const serviceType = service.type === 'ENGINE_OIL' ? 'wymiany oleju silnikowego' :
                     service.type === 'TRANSMISSION_OIL' ? 'wymiany oleju przekładniowego' :
                     service.type === 'TECHNICAL_INSPECTION' ? 'przeglądu technicznego' :
                     'naprawy'
  
  if (service.urgency === 'critical') {
    return `PILNE: Pojazd ${vehicle} wymaga ${serviceType}. Termin minął ${service.dueIn}.`
  } else if (service.urgency === 'warning') {
    return `UWAGA: Pojazd ${vehicle} wymaga ${serviceType} za ${service.dueIn}.`
  } else {
    return `Przypomnienie: Pojazd ${vehicle} będzie wymagał ${serviceType} za ${service.dueIn}.`
  }
}