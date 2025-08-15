'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Calendar,
  Wrench,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
// import { useProjectEmployees } from '@/features/projekty/hooks/useProjectEmployees'

interface TeamOverviewProps {
  projectId: string
}

const statusConfig = {
  active: { label: 'Aktywny', color: 'success', icon: CheckCircle },
  on_leave: { label: 'Urlop', color: 'warning', icon: Clock },
  inactive: { label: 'Nieaktywny', color: 'neutral', icon: AlertCircle }
} as const

const equipmentTypeConfig = {
  tool: { label: 'Narzędzie', icon: Wrench, color: 'primary' },
  vehicle: { label: 'Pojazd', icon: Package, color: 'blue' },
  safety: { label: 'BHP', icon: AlertCircle, color: 'orange' },
  other: { label: 'Inne', icon: Package, color: 'neutral' }
} as const

export function TeamOverview({ projectId }: TeamOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  // Mock data - replace with actual API call
  const mockEmployees = [
    {
      id: '1',
      name: 'Jan Kowalski',
      position: 'Tynkarz maszynowy',
      department: 'Tynki wewnętrzne',
      status: 'active' as const,
      email: 'jan.kowalski@firma.pl',
      phone: '+48 123 456 789',
      tasksCompleted: 8,
      tasksAssigned: 12,
      metersSquareCompleted: 485.5, // m² tynków gipsowych
      metersLinearCompleted: 125.8, // mb narożników i krawędzi
      hourlyRateSquare: 18, // zł/m² tynki gipsowe
      hourlyRateLinear: 15, // zł/mb narożniki
      currentApartments: ['1A', '1B', '2A'],
      equipmentAssigned: [
        {
          id: 'eq1',
          name: 'Agregat tynkarski PFT G4',
          type: 'tool' as const,
          serialNumber: 'PFT2023001',
          condition: 'excellent' as const
        },
        {
          id: 'eq2',
          name: 'Mieszadło do gipsu Collomix',
          type: 'tool' as const,
          serialNumber: 'COL789123',
          condition: 'good' as const
        },
        {
          id: 'eq3',
          name: 'Paca tynkarska nierdzewna 480mm',
          type: 'tool' as const,
          serialNumber: 'PAC456789',
          condition: 'excellent' as const
        }
      ]
    },
    {
      id: '2',
      name: 'Anna Nowak',
      position: 'Tynkarz cementowo-wapienny',
      department: 'Tynki zewnętrzne',
      status: 'active' as const,
      email: 'anna.nowak@firma.pl',
      phone: '+48 234 567 890',
      tasksCompleted: 15,
      tasksAssigned: 18,
      metersSquareCompleted: 312.0, // m² tynków cementowo-wapiennych
      metersLinearCompleted: 89.5, // mb cokołów
      hourlyRateSquare: 22, // zł/m² tynki cementowo-wapienne (droższe)
      hourlyRateLinear: 18, // zł/mb cokoły
      currentApartments: ['3A', '3B'],
      equipmentAssigned: [
        {
          id: 'eq4',
          name: 'Agregat tynkarski Monojet',
          type: 'tool' as const,
          serialNumber: 'MJ2023456',
          condition: 'excellent' as const
        },
        {
          id: 'eq5',
          name: 'Wąż tynkarski 20m',
          type: 'tool' as const,
          serialNumber: 'WZ789123',
          condition: 'good' as const
        }
      ]
    },
    {
      id: '3',
      name: 'Piotr Wiśniewski',
      position: 'Tynkarz wielofunkcyjny',
      department: 'Tynki specjalistyczne',
      status: 'on_leave' as const,
      email: 'piotr.wisniewski@firma.pl',
      phone: '+48 345 678 901',
      tasksCompleted: 6,
      tasksAssigned: 10,
      metersSquareCompleted: 198.5, // m² różnych tynków
      metersLinearCompleted: 67.2, // mb detali
      hourlyRateSquare: 25, // zł/m² tynki specjalistyczne (najdroższe)
      hourlyRateLinear: 20, // zł/mb detale architektoniczne
      currentApartments: ['2B', '2C'],
      equipmentAssigned: [
        {
          id: 'eq6',
          name: 'Agregat tynkarski Putzmeister SP11',
          type: 'tool' as const,
          serialNumber: 'PM789456',
          condition: 'fair' as const
        }
      ]
    },
    {
      id: '4',
      name: 'Maria Kaczmarek',
      position: 'Tynkarz gipsowy',
      department: 'Wykończenia wnętrz',
      status: 'active' as const,
      email: 'maria.kaczmarek@firma.pl',
      phone: '+48 456 789 012',
      tasksCompleted: 22,
      tasksAssigned: 25,
      metersSquareCompleted: 678.3, // m² tynków gipsowych
      metersLinearCompleted: 156.7, // mb przejść i naroży
      hourlyRateSquare: 16, // zł/m² tynki gipsowe standardowe
      hourlyRateLinear: 12, // zł/mb detale proste
      currentApartments: ['4A', '4B', '4C'],
      equipmentAssigned: [
        {
          id: 'eq7',
          name: 'Mieszarka do gipsu 140L',
          type: 'tool' as const,
          serialNumber: 'MIE123789',
          condition: 'excellent' as const
        },
        {
          id: 'eq8',
          name: 'Rusztowanie aluminiowe',
          type: 'other' as const,
          serialNumber: 'RUS456123',
          condition: 'good' as const
        }
      ]
    },
    {
      id: '5',
      name: 'Tomasz Lewandowski',
      position: 'Pomocnik tynkarza',
      department: 'Wsparcie produkcji',
      status: 'inactive' as const,
      email: 'tomasz.lewandowski@firma.pl',
      phone: '+48 567 890 123',
      tasksCompleted: 3,
      tasksAssigned: 8,
      metersSquareCompleted: 89.2, // m² pomocy przy tynkowaniu
      metersLinearCompleted: 45.6, // mb przygotowanie podłoża
      hourlyRateSquare: 8, // zł/m² prace pomocnicze
      hourlyRateLinear: 6, // zł/mb przygotowanie
      currentApartments: ['1C'],
      equipmentAssigned: [
        {
          id: 'eq9',
          name: 'Wiadro budowlane 20L',
          type: 'tool' as const,
          serialNumber: 'WIA789456',
          condition: 'good' as const
        }
      ]
    }
  ]

  const employees = mockEmployees
  const loading = false
  const error = null
  const refetch = () => Promise.resolve()

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const departments = Array.from(new Set(employees.map(e => e.department)))

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Ładowanie pracowników projektu...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Wystąpił błąd
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button variant="primary" size="md" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Szukaj pracowników..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="active">Aktywni</option>
            <option value="on_leave">Na urlopie</option>
            <option value="inactive">Nieaktywni</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="all">Wszystkie działy</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Filter className="w-4 h-4 mr-2" />
            Więcej filtrów
          </Button>
          <Button variant="primary" size="md">
            <UserPlus className="w-4 h-4 mr-2" />
            Przypisz pracownika
          </Button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const statusConf = statusConfig[employee.status]
          const StatusIcon = statusConf.icon

          return (
            <div
              key={employee.id}
              className={cn(
                "bg-white rounded-xl border p-6 transition-all duration-200",
                selectedEmployee === employee.id
                  ? "border-primary-500 shadow-lg ring-2 ring-primary-100"
                  : "border-neutral-200 hover:shadow-md hover:border-neutral-300"
              )}
              onClick={() => setSelectedEmployee(employee.id)}
            >
              {/* Employee Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-700">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{employee.name}</h3>
                    <p className="text-sm text-neutral-600">{employee.position}</p>
                  </div>
                </div>
                <button className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Status and Department */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={statusConf.color as any} size="sm" className="flex items-center gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {statusConf.label}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {employee.department}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone}</span>
                </div>
              </div>

              {/* Task Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-700">Postęp zadań</span>
                  <span className="text-sm text-neutral-600">
                    {employee.tasksCompleted}/{employee.tasksAssigned}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(employee.tasksCompleted / employee.tasksAssigned) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Apartments */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Aktualne pomieszczenia</h4>
                <div className="flex flex-wrap gap-2">
                  {employee.currentApartments.map(apartment => (
                    <Badge key={apartment} variant="neutral" size="sm">
                      {apartment}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipment Section */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Przypisany sprzęt ({employee.equipmentAssigned.length})
                </h4>
                <div className="space-y-2">
                  {employee.equipmentAssigned.slice(0, 2).map(equipment => {
                    const typeConf = equipmentTypeConfig[equipment.type]
                    const TypeIcon = typeConf.icon
                    
                    return (
                      <div 
                        key={equipment.id}
                        className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          `bg-${typeConf.color}-100`
                        )}>
                          <TypeIcon className={cn("w-4 h-4", `text-${typeConf.color}-600`)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {equipment.name}
                          </p>
                          {equipment.serialNumber && (
                            <p className="text-xs text-neutral-500">
                              SN: {equipment.serialNumber}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={equipment.condition === 'excellent' ? 'success' : 'warning'} 
                          size="xs"
                        >
                          {equipment.condition === 'excellent' ? 'Doskonały' : 
                           equipment.condition === 'good' ? 'Dobry' : 
                           equipment.condition === 'fair' ? 'Średni' : 'Słaby'}
                        </Badge>
                      </div>
                    )
                  })}
                  {employee.equipmentAssigned.length > 2 && (
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Zobacz więcej ({employee.equipmentAssigned.length - 2})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Brak przypisanych pracowników
          </h3>
          <p className="text-neutral-600 mb-4">
            Nie znaleziono pracowników spełniających kryteria wyszukiwania.
          </p>
          <Button variant="primary" size="md">
            <UserPlus className="w-4 h-4 mr-2" />
            Przypisz pierwszego pracownika
          </Button>
        </div>
      )}
    </div>
  )
}