'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  VehicleWithServicesEnhanced,
  ServiceDeadlineDataEnhanced,
  ServiceStatisticsEnhanced,
  ScheduleServiceDataEnhanced,
  ServiceHistoryFiltersEnhanced,
  ServiceRecordEnhanced,
  EnhancedServiceType,
  ServiceProvider
} from '@/types/fleet-enhanced'
import { mockVehiclesWithServicesEnhanced, mockServiceProviders } from '@/types/fleet-enhanced'
import {
  generateServiceDeadlineData,
  calculateServiceStatistics,
  sortServicesByPriority
} from '@/utils/fleet/serviceCalculations'

interface UseServiceManagementReturn {
  // State
  vehicles: VehicleWithServicesEnhanced[]
  deadlineData: ServiceDeadlineDataEnhanced
  statistics: ServiceStatisticsEnhanced
  serviceProviders: ServiceProvider[]
  loading: boolean
  error: string | null

  // Actions
  scheduleService: (data: ScheduleServiceDataEnhanced) => Promise<boolean>
  markServiceComplete: (serviceId: string) => Promise<boolean>
  updateServiceHistory: (vehicleId: string, service: ServiceRecordEnhanced) => Promise<boolean>
  refreshData: () => Promise<void>
  
  // Filtering and search
  filterServiceHistory: (filters: ServiceHistoryFiltersEnhanced, vehicleId?: string) => ServiceRecordEnhanced[]
  getVehicleByLicensePlate: (licensePlate: string) => VehicleWithServicesEnhanced | undefined
  getOverdueServices: () => VehicleWithServicesEnhanced[]
  getUpcomingServices: (days?: number) => VehicleWithServicesEnhanced[]
}

export const useServiceManagement = (): UseServiceManagementReturn => {
  const [vehicles, setVehicles] = useState<VehicleWithServicesEnhanced[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const deadlineData = generateServiceDeadlineData(vehicles)
  const statistics = calculateServiceStatistics(vehicles)

  // Initialize with mock data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setVehicles(mockVehiclesWithServicesEnhanced)
        setServiceProviders(mockServiceProviders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setVehicles(mockVehiclesWithServicesEnhanced)
      setServiceProviders(mockServiceProviders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Schedule a service
  const scheduleService = useCallback(async (data: ScheduleServiceDataEnhanced): Promise<boolean> => {
    try {
      setError(null)
      
      // In a real app, this would make an API call
      console.log('Scheduling service:', data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state to reflect the scheduled service
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.id === data.vehicleId) {
            // Remove the service from upcoming services
            const updatedUpcomingServices = vehicle.upcomingServices.filter(
              service => service.type !== data.serviceType
            )
            
            return {
              ...vehicle,
              upcomingServices: updatedUpcomingServices
            }
          }
          return vehicle
        })
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule service')
      return false
    }
  }, [])

  // Mark service as complete
  const markServiceComplete = useCallback(async (serviceId: string): Promise<boolean> => {
    try {
      setError(null)
      
      console.log('Marking service complete:', serviceId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Update local state
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => ({
          ...vehicle,
          upcomingServices: vehicle.upcomingServices.filter(service => service.id !== serviceId)
        }))
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark service complete')
      return false
    }
  }, [])

  // Update service history
  const updateServiceHistory = useCallback(async (
    vehicleId: string, 
    service: ServiceRecordEnhanced
  ): Promise<boolean> => {
    try {
      setError(null)
      
      console.log('Updating service history:', vehicleId, service)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.id === vehicleId) {
            return {
              ...vehicle,
              serviceHistory: [service, ...vehicle.serviceHistory],
              serviceStats: {
                ...vehicle.serviceStats,
                totalServicesThisYear: vehicle.serviceStats.totalServicesThisYear + 1,
                totalServiceCosts: vehicle.serviceStats.totalServiceCosts + service.cost,
                lastServiceDate: service.date,
                averageServiceCost: 
                  (vehicle.serviceStats.totalServiceCosts + service.cost) / 
                  (vehicle.serviceStats.totalServicesThisYear + 1)
              }
            }
          }
          return vehicle
        })
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service history')
      return false
    }
  }, [])

  // Filter service history
  const filterServiceHistory = useCallback(
    (filters: ServiceHistoryFiltersEnhanced, vehicleId?: string): ServiceRecordEnhanced[] => {
      let allHistory: ServiceRecordEnhanced[] = []
      
      if (vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId)
        allHistory = vehicle?.serviceHistory || []
      } else {
        allHistory = vehicles.flatMap(vehicle => vehicle.serviceHistory)
      }

      let filtered = [...allHistory]

      // Apply filters
      if (filters.serviceType) {
        filtered = filtered.filter(service => service.type === filters.serviceType)
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(service => service.date >= filters.dateFrom!)
      }

      if (filters.dateTo) {
        filtered = filtered.filter(service => service.date <= filters.dateTo!)
      }

      if (filters.costMin !== undefined) {
        filtered = filtered.filter(service => service.cost >= filters.costMin!)
      }

      if (filters.costMax !== undefined) {
        filtered = filtered.filter(service => service.cost <= filters.costMax!)
      }

      if (filters.provider) {
        filtered = filtered.filter(service => 
          service.provider.toLowerCase().includes(filters.provider!.toLowerCase())
        )
      }

      // Apply sorting
      if (filters.sortBy) {
        filtered.sort((a, b) => {
          let comparison = 0
          
          switch (filters.sortBy) {
            case 'date':
              comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
              break
            case 'cost':
              comparison = b.cost - a.cost
              break
            case 'type':
              comparison = a.type.localeCompare(b.type)
              break
            case 'provider':
              comparison = a.provider.localeCompare(b.provider)
              break
          }
          
          return filters.sortOrder === 'desc' ? comparison : -comparison
        })
      }

      return filtered
    },
    [vehicles]
  )

  // Get vehicle by license plate
  const getVehicleByLicensePlate = useCallback(
    (licensePlate: string): VehicleWithServicesEnhanced | undefined => {
      return vehicles.find(vehicle => 
        vehicle.licensePlate.toLowerCase() === licensePlate.toLowerCase()
      )
    },
    [vehicles]
  )

  // Get vehicles with overdue services
  const getOverdueServices = useCallback((): VehicleWithServicesEnhanced[] => {
    return vehicles.filter(vehicle => 
      vehicle.upcomingServices.some(service => service.urgency === 'critical')
    )
  }, [vehicles])

  // Get vehicles with upcoming services (within specified days)
  const getUpcomingServices = useCallback((days: number = 30): VehicleWithServicesEnhanced[] => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    
    return vehicles.filter(vehicle => 
      vehicle.upcomingServices.some(service => 
        service.nextDueDate <= targetDate && service.urgency !== 'critical'
      )
    )
  }, [vehicles])

  // Add additional utility methods
  const getServicesByType = useCallback((type: EnhancedServiceType) => {
    return vehicles.filter(vehicle => 
      vehicle.upcomingServices.some(service => service.type === type)
    )
  }, [vehicles])

  const getVehicleServiceCompliance = useCallback((vehicleId: string): number => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle?.serviceStats.maintenanceCompliance || 0
  }, [vehicles])

  const getTopServiceProviders = useCallback(() => {
    return statistics.topServiceProviders
  }, [statistics])

  const getMostExpensiveVehicles = useCallback((limit: number = 5) => {
    return [...vehicles]
      .sort((a, b) => b.serviceStats.totalServiceCosts - a.serviceStats.totalServiceCosts)
      .slice(0, limit)
  }, [vehicles])

  return {
    // State
    vehicles,
    deadlineData,
    statistics,
    serviceProviders,
    loading,
    error,

    // Actions  
    scheduleService,
    markServiceComplete,
    updateServiceHistory,
    refreshData,

    // Filtering and search
    filterServiceHistory,
    getVehicleByLicensePlate,
    getOverdueServices,
    getUpcomingServices
  }
}