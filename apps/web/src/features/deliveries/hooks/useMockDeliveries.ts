import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  DeliveryListItem,
  DeliveryStats,
  DeliveryFiltersInput,
  UseDeliveriesReturn,
  DeliveryWithRelations,
  DeliveryItem,
  DeliveryPhoto,
  UseDeliveryReturn
} from '@/features/deliveries/types'
import { 
  DeliveryStatus, 
  DeliveryType, 
  DeliveryPriority,
  ItemQualityStatus,
  DeliveryPhotoType 
} from '@/features/deliveries/types'

// Mock data generator
const generateMockDeliveries = (count: number = 50): DeliveryListItem[] => {
  const suppliers = [
    'Knauf Polska', 
    'Cemex Polska', 
    'Atlas Polska',
    'Mapei Polska',
    'Lhoist Polska',
    'Ceresit Henkel',
    'Nida Gips',
    'Profil System',
    'Weber Saint-Gobain',
    'Kreisel Technika Budowlana',
    'Baumit Polska',
    'Sto Polska'
  ]
  
  const projects = [
    { id: 'proj-1', name: 'Osiedle Słoneczne', address: 'ul. Słoneczna 15, Warszawa' },
    { id: 'proj-2', name: 'Biurowiec Horizon', address: 'ul. Marszałkowska 100, Warszawa' },
    { id: 'proj-3', name: 'Galeria Północna', address: 'ul. Światowida 17, Warszawa' },
    { id: 'proj-4', name: 'Apartamenty Riverside', address: 'ul. Wiślana 8, Kraków' },
    null // Some deliveries go directly to warehouse
  ]
  
  const statuses = Object.values(DeliveryStatus)
  const types = Object.values(DeliveryType)
  
  const deliveries: DeliveryListItem[] = []
  
  for (let i = 0; i < count; i++) {
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() - Math.floor(Math.random() * 30) + 10) // -20 to +10 days
    
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const deliveryType = types[Math.floor(Math.random() * types.length)]
    
    deliveries.push({
      id: `del-${i + 1}`,
      supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
      deliveryDate,
      status,
      deliveryType,
      totalWeight: Math.floor(Math.random() * 5000) + 100,
      totalValue: Math.floor(Math.random() * 50000) + 1000,
      palletCount: deliveryType === DeliveryType.PALLET ? Math.floor(Math.random() * 20) + 1 : null,
      packageCount: deliveryType === DeliveryType.PACKAGE ? Math.floor(Math.random() * 50) + 5 : null,
      project: projects[Math.floor(Math.random() * projects.length)],
      receivedBy: {
        id: 'user-1',
        name: 'Jan Kowalski'
      },
      _count: {
        items: Math.floor(Math.random() * 10) + 1,
        photos: Math.floor(Math.random() * 5)
      }
    })
  }
  
  return deliveries
}

// Mock stats generator
const generateMockStats = (deliveries: DeliveryListItem[]): DeliveryStats => {
  const pendingCount = deliveries.filter(d => d.status === DeliveryStatus.PENDING).length
  const acceptedCount = deliveries.filter(d => d.status === DeliveryStatus.ACCEPTED).length
  const totalValue = deliveries.reduce((sum, d) => sum + (d.totalValue || 0), 0)
  
  return {
    totalDeliveries: deliveries.length,
    pendingDeliveries: pendingCount,
    scheduledDeliveries: Math.floor(pendingCount * 0.7), // 70% of pending are scheduled
    completedDeliveries: acceptedCount,
    totalValue,
    averageDeliveryTime: 3.5,
    qualityIssueRate: 8.5,
    onTimeDeliveryRate: 92.3
  }
}

// Mock implementation of useDeliveries hook
export const useMockDeliveries = (options: any = {}): UseDeliveriesReturn => {
  const {
    initialFilters = {},
    autoFetch = true,
    pageSize = 20
  } = options

  // Generate all mock data once
  const [allDeliveries] = useState<DeliveryListItem[]>(() => generateMockDeliveries(150))
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryListItem[]>(allDeliveries)
  const [deliveries, setDeliveries] = useState<DeliveryListItem[]>([])
  const [stats] = useState<DeliveryStats>(() => generateMockStats(generateMockDeliveries(150)))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DeliveryFiltersInput>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  })

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...allDeliveries]
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(d => 
        d.supplierName.toLowerCase().includes(search) ||
        d.project?.name.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search)
      )
    }
    
    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(d => d.status === filters.status)
    }
    
    // Type filter
    if (filters.deliveryType && filters.deliveryType !== 'ALL') {
      filtered = filtered.filter(d => d.deliveryType === filters.deliveryType)
    }
    
    // Project filter
    if (filters.projectId) {
      filtered = filtered.filter(d => d.project?.id === filters.projectId)
    }
    
    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(d => {
        const date = new Date(d.deliveryDate)
        return date >= filters.dateRange!.from && date <= filters.dateRange!.to
      })
    }
    
    setFilteredDeliveries(filtered)
  }, [allDeliveries, filters])

  // Paginate deliveries
  const paginateDeliveries = useCallback(() => {
    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    setDeliveries(filteredDeliveries.slice(start, end))
  }, [filteredDeliveries, pagination.page, pagination.limit])

  // Simulate fetch with delay (for mock data, just show loading briefly)
  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    // Brief loading state for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setIsLoading(false)
  }, [])

  const updateFilters = useCallback((newFilters: Partial<DeliveryFiltersInput>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, limit: size, page: 1 }))
  }, [])

  const refresh = useCallback(async () => {
    await fetchDeliveries()
  }, [fetchDeliveries])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Update pagination when filtered deliveries change
  useEffect(() => {
    const totalPages = Math.ceil(filteredDeliveries.length / pagination.limit)
    setPagination(prev => ({
      ...prev,
      total: filteredDeliveries.length,
      totalPages,
      page: Math.min(prev.page, totalPages || 1)
    }))
  }, [filteredDeliveries, pagination.limit])

  // Paginate when filtered deliveries or pagination changes
  useEffect(() => {
    paginateDeliveries()
  }, [paginateDeliveries])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchDeliveries()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    deliveries,
    stats,
    isLoading,
    error,
    filters,
    pagination,
    fetchDeliveries,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refresh
  }
}

// Generate detailed mock delivery data
const generateMockDeliveryWithRelations = (deliveryId: string): DeliveryWithRelations | null => {
  const deliveryIndex = parseInt(deliveryId.replace('del-', '')) - 1
  if (deliveryIndex < 0 || deliveryIndex >= 150) return null
  
  const suppliers = [
    'Knauf Polska', 
    'Cemex Polska', 
    'Atlas Polska',
    'Mapei Polska',
    'Lhoist Polska',
    'Ceresit Henkel',
    'Nida Gips',
    'Profil System',
    'Tynki Dekoracyjne S.A.',
    'Materiały Tynkarskie Sp. z o.o.'
  ]
  
  const projects = [
    { id: 'proj-1', name: 'Osiedle Słoneczne', address: 'ul. Słoneczna 15, Warszawa' },
    { id: 'proj-2', name: 'Biurowiec Horizon', address: 'ul. Marszałkowska 100, Warszawa' },
    { id: 'proj-3', name: 'Galeria Północna', address: 'ul. Światowida 17, Warszawa' },
    { id: 'proj-4', name: 'Apartamenty Riverside', address: 'ul. Wiślana 8, Kraków' },
    null
  ]
  
  const materials = [
    'Gips szpachlowy maszynowy MP75',
    'Tynk cementowo-wapienny CTW',
    'Masa szpachlowa gipsowa wykończeniowa',
    'Siatka zbrojąca z włókna szklanego',
    'Narożniki perforowane aluminiowe',
    'Grunt głęboko penetrujący uniwersalny',
    'Tynk gipsowy ręczny MP60',
    'Klej do siatki zbrojącej',
    'Profile startowe aluminiowe',
    'Piasek kwarcowy do tynków 0-4mm',
    'Wapno hydratyzowane budowlane',
    'Cement portlandzki CEM I 42,5R'
  ]
  
  const statuses = Object.values(DeliveryStatus)
  const types = Object.values(DeliveryType)
  const qualityStatuses = Object.values(ItemQualityStatus)
  
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() - Math.floor(Math.random() * 30) + 10)
  
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const deliveryType = types[Math.floor(Math.random() * types.length)]
  const project = projects[Math.floor(Math.random() * projects.length)]
  
  // Generate items
  const itemCount = Math.floor(Math.random() * 8) + 2
  const items: DeliveryItem[] = []
  
  for (let i = 0; i < itemCount; i++) {
    const orderedQuantity = Math.floor(Math.random() * 50) + 1
    const deliveredQuantity = Math.floor(orderedQuantity * (0.8 + Math.random() * 0.4)) // 80-120% of ordered
    const unitPrice = Math.floor(Math.random() * 200) + 10
    const qualityStatus = qualityStatuses[Math.floor(Math.random() * qualityStatuses.length)]
    
    let acceptedQuantity: number | null = null
    let rejectedQuantity: number | null = null
    
    if (status === DeliveryStatus.ACCEPTED || status === DeliveryStatus.REJECTED) {
      if (qualityStatus === ItemQualityStatus.APPROVED) {
        acceptedQuantity = deliveredQuantity
        rejectedQuantity = 0
      } else if (qualityStatus === ItemQualityStatus.REJECTED) {
        acceptedQuantity = 0
        rejectedQuantity = deliveredQuantity
      } else if (qualityStatus === ItemQualityStatus.PARTIALLY_APPROVED) {
        acceptedQuantity = Math.floor(deliveredQuantity * 0.7)
        rejectedQuantity = deliveredQuantity - acceptedQuantity
      }
    }
    
    items.push({
      id: `item-${deliveryId}-${i + 1}`,
      deliveryId,
      materialId: `mat-${i + 1}`,
      itemName: materials[Math.floor(Math.random() * materials.length)],
      orderedQuantity,
      deliveredQuantity,
      acceptedQuantity,
      rejectedQuantity,
      unit: ['kg', 'szt', 'm3', 'm2', 'worek', 'pud'][Math.floor(Math.random() * 6)],
      unitPrice,
      totalPrice: deliveredQuantity * unitPrice,
      qualityStatus,
      qualityNotes: qualityStatus === ItemQualityStatus.DAMAGED ? 'Niewielkie uszkodzenia opakowania' :
                   qualityStatus === ItemQualityStatus.REJECTED ? 'Materiał nie spełnia wymagań jakościowych' : null,
      qualityCheckDate: status === DeliveryStatus.ACCEPTED ? deliveryDate : null,
      createdAt: deliveryDate,
      updatedAt: deliveryDate
    })
  }
  
  // Generate photos
  const photoCount = Math.floor(Math.random() * 6) + 1
  const photos: DeliveryPhoto[] = []
  const photoTypes = Object.values(DeliveryPhotoType)
  
  for (let i = 0; i < photoCount; i++) {
    photos.push({
      id: `photo-${deliveryId}-${i + 1}`,
      deliveryId,
      photoType: photoTypes[Math.floor(Math.random() * photoTypes.length)],
      url: `/mock-photos/delivery-${deliveryId}-${i + 1}.jpg`,
      description: `Zdjęcie ${i + 1} dostawy`,
      uploadedAt: deliveryDate
    })
  }
  
  const totalValue = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  
  return {
    id: deliveryId,
    projectId: project?.id || null,
    supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
    supplierContact: '+48 123 456 789',
    deliveryDate,
    scheduledDate: new Date(deliveryDate.getTime() - 86400000), // Day before
    deliveryType,
    status,
    priority: DeliveryPriority.NORMAL,
    
    // Driver and Vehicle Information
    driverName: ['Jan Kowalski', 'Anna Nowak', 'Piotr Wiśniewski', 'Maria Dąbrowska'][Math.floor(Math.random() * 4)],
    driverPhone: '+48 987 654 321',
    vehiclePlate: `WA ${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
    vehicleType: 'Ciężarówka',
    
    // Quantities and Measurements
    totalWeight: Math.floor(Math.random() * 5000) + 500,
    totalVolume: Math.floor(Math.random() * 50) + 10,
    palletCount: deliveryType === DeliveryType.PALLET ? Math.floor(Math.random() * 20) + 1 : null,
    packageCount: deliveryType === DeliveryType.PACKAGE ? Math.floor(Math.random() * 50) + 5 : null,
    
    // Delivery Details
    arrivalTime: new Date(deliveryDate.getTime() + Math.floor(Math.random() * 3600000)),
    completionTime: status === DeliveryStatus.ACCEPTED ? new Date(deliveryDate.getTime() + Math.floor(Math.random() * 7200000) + 3600000) : null,
    deliveryAddress: project?.address || 'Magazyn główny, ul. Magazynowa 1, Warszawa',
    notes: Math.random() > 0.7 ? 'Dostawa wymaga odbioru w godzinach 8:00-16:00' : null,
    internalNotes: null,
    
    // Documentation
    deliveryNoteNumber: `WZ/${new Date().getFullYear()}/${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    invoiceNumber: `FV/${new Date().getFullYear()}/${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    
    // Cost Information
    deliveryCost: Math.floor(Math.random() * 500) + 100,
    totalValue,
    currency: 'PLN',
    
    // Quality Control
    qualityCheckRequired: Math.random() > 0.3,
    qualityNotes: status === DeliveryStatus.ACCEPTED ? 'Kontrola zakończona pomyślnie' : null,
    
    // Storage and Location
    storageLocation: 'Sekcja A',
    warehouseSection: 'A-01',
    
    // User Relations
    receivedById: 'user-1',
    qualityCheckById: status === DeliveryStatus.ACCEPTED ? 'user-2' : null,
    
    // Timestamps
    createdAt: deliveryDate,
    updatedAt: deliveryDate,
    
    // Relations
    project,
    receivedBy: {
      id: 'user-1',
      email: 'jan.kowalski@example.com',
      name: 'Jan Kowalski',
      role: 'COORDINATOR',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    qualityCheckBy: status === DeliveryStatus.ACCEPTED ? {
      id: 'user-2',
      email: 'anna.nowak@example.com',
      name: 'Anna Nowak',
      role: 'QUALITY_CONTROLLER',
      createdAt: new Date(),
      updatedAt: new Date()
    } : null,
    items,
    photos,
    schedule: null,
    _count: {
      items: items.length,
      photos: photos.length
    }
  }
}

// Mock implementation of useProjectDeliveries hook (project-specific)
export const useMockProjectDeliveries = (
  projectId: string,
  options: {
    searchTerm?: string
    status?: DeliveryStatus
    deliveryType?: DeliveryType
    startDate?: string
    endDate?: string
  } = {}
): {
  deliveries: DeliveryListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  statistics: { total: number; pending: number; completed: number; totalValue: number }
  loading: boolean
  error: string | null
  refetch: () => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
} => {
  // Generate mock data specific to plastering/construction company
  const [allDeliveries] = useState<DeliveryListItem[]>(() => {
    const mockData = generateMockDeliveries(50)
    // Filter by project and add construction-specific materials
    return mockData.filter(delivery => delivery.project?.id === projectId || Math.random() > 0.7)
      .slice(0, 15) // Limit to reasonable amount for a single project
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryListItem[]>(allDeliveries)

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...allDeliveries]
    
    if (options.searchTerm) {
      const search = options.searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.supplierName.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search)
      )
    }
    
    if (options.status) {
      filtered = filtered.filter(d => d.status === options.status)
    }
    
    if (options.deliveryType) {
      filtered = filtered.filter(d => d.deliveryType === options.deliveryType)
    }
    
    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate)
      const end = new Date(options.endDate)
      filtered = filtered.filter(d => {
        const date = new Date(d.deliveryDate)
        return date >= start && date <= end
      })
    }
    
    setFilteredDeliveries(filtered)
  }, [allDeliveries, options])

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredDeliveries.length
    const pending = filteredDeliveries.filter(d => d.status === DeliveryStatus.PENDING).length
    const completed = filteredDeliveries.filter(d => d.status === DeliveryStatus.ACCEPTED).length
    const totalValue = filteredDeliveries.reduce((sum, d) => sum + (d.totalValue || 0), 0)
    
    return { total, pending, completed, totalValue }
  }, [filteredDeliveries])

  // Pagination
  const pagination = useMemo(() => {
    const total = filteredDeliveries.length
    const totalPages = Math.ceil(total / pageSize)
    return { page, limit: pageSize, total, totalPages }
  }, [filteredDeliveries.length, page, pageSize])

  // Get current page deliveries
  const deliveries = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredDeliveries.slice(start, end)
  }, [filteredDeliveries, page, pageSize])

  const refetch = useCallback(async () => {
    setLoading(true)
    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 200))
    setLoading(false)
  }, [])

  const setPageHandler = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const setPageSizeHandler = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }, [])

  // Apply filters when options change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  return {
    deliveries,
    pagination,
    statistics,
    loading,
    error,
    refetch,
    setPage: setPageHandler,
    setPageSize: setPageSizeHandler
  }
}

// Mock implementation of useDelivery hook
export const useMockDelivery = (deliveryId: string): UseDeliveryReturn => {
  const [delivery, setDelivery] = useState<DeliveryWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDelivery = useCallback(async () => {
    if (!deliveryId) return

    setIsLoading(true)
    setError(null)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const mockDelivery = generateMockDeliveryWithRelations(deliveryId)
      
      if (!mockDelivery) {
        throw new Error('Delivery not found')
      }
      
      setDelivery(mockDelivery)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [deliveryId])

  const updateDelivery = useCallback(async (updates: any) => {
    if (!deliveryId || !delivery) return

    setIsLoading(true)
    setError(null)

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Update local state
      setDelivery(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [deliveryId, delivery])

  const refreshDelivery = useCallback(async () => {
    await fetchDelivery()
  }, [fetchDelivery])

  // Auto-fetch on mount and when deliveryId changes
  useEffect(() => {
    fetchDelivery()
  }, [fetchDelivery])

  return {
    delivery,
    isLoading,
    error,
    fetchDelivery,
    updateDelivery,
    refreshDelivery
  }
}