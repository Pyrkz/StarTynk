'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Download, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Plus,
  Minus,
  CreditCard,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
// import { useProjectPayroll } from '@/features/projekty/hooks/useProjectPayroll'

interface PayrollEarningsProps {
  projectId: string
}

const statusConfig = {
  pending: { label: 'Oczekuje', color: 'warning', icon: Clock },
  processing: { label: 'W trakcie', color: 'primary', icon: AlertCircle },
  partially_paid: { label: 'Częściowo wypłacone', color: 'warning', icon: AlertCircle },
  paid: { label: 'Wypłacone', color: 'success', icon: CheckCircle }
} as const

const bonusTypeConfig = {
  quality: { label: 'Jakość', color: 'success' },
  performance: { label: 'Wydajność', color: 'blue' },
  project_completion: { label: 'Ukończenie projektu', color: 'primary' },
  attendance: { label: 'Obecność', color: 'green' },
  other: { label: 'Inne', color: 'neutral' }
} as const

const deductionTypeConfig = {
  absence: { label: 'Nieobecność', color: 'red' },
  damage: { label: 'Szkoda', color: 'orange' },
  advance: { label: 'Zaliczka', color: 'yellow' },
  other: { label: 'Inne', color: 'neutral' }
} as const

export function PayrollEarnings({ projectId }: PayrollEarningsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState<string>('2024-11')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

  // Mock data - replace with actual API call
  const mockRecords = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Jan Kowalski',
      employeePosition: 'Tynkarz maszynowy',
      period: '2024-11',
      
      // Measurement-based payment system
      workCompleted: [
        {
          apartmentId: '1A',
          apartmentNumber: '1A',
          taskType: 'Tynki gipsowe maszynowe',
          metersSquare: 85.5,
          metersLinear: 0,
          ratePerSquareMeter: 18, // Stawka dla tynków gipsowych
          ratePerLinearMeter: 0,
          estimatedAmount: 1539.00, // 85.5 × 18
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-28'),
            metersVerified: 85.5, // Koordynator potwierdza metry
            qualityApprovalPercent: 100, // 100% zatwierdzonych
            approvedAmount: 1539.00, // 85.5 × 18 × 100%
            feedback: 'Tynki gipsowe wykonane profesjonalnie. Równa powierzchnia, brak pęknięć.',
            status: 'approved' as const
          }
        },
        {
          apartmentId: '1B', 
          apartmentNumber: '1B',
          taskType: 'Tynki gipsowe maszynowe + narożniki',
          metersSquare: 92.0,
          metersLinear: 24.5, // metry narożników
          ratePerSquareMeter: 18,
          ratePerLinearMeter: 15,
          estimatedAmount: 2023.50, // 92.0 × 18 + 24.5 × 15
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator', 
            reviewDate: new Date('2024-11-29'),
            metersVerified: 92.0,
            qualityApprovalPercent: 80, // 80% zatwierdzonych, 20% do korekty
            approvedAmount: 1618.80, // (92.0 × 18 + 24.5 × 15) × 80%
            pendingAmount: 404.70, // Pozostałe 20%
            feedback: 'Dobra jakość tynków gipsowych. Narożniki wymagają poprawek - nierówne krawędzie.',
            correctionsNeeded: 'Poprawić wykończenie narożników w pokoju głównym, wyrównać krawędzie przy oknach.',
            revisionDeadline: new Date('2024-12-15'),
            status: 'partially_approved' as const
          }
        }
      ],
      
      baseWage: 0, // Płatność tylko za metry
      totalEstimated: 3562.50, // Suma estimated amounts (1539 + 2023.50)
      totalApproved: 3157.80, // Suma approved amounts (1539 + 1618.80)
      totalPending: 404.70, // Suma pending amounts
      bonuses: [
        {
          id: 'b1',
          type: 'quality' as const,
          amount: 300,
          description: 'Premia za terminowość'
        }
      ],
      deductions: [
        {
          id: 'd1',
          type: 'advance' as const,
          amount: 1000,
          description: 'Zaliczka z 15.11'
        }
      ],
      
      totalGross: 2457.80, // totalApproved + bonuses - deductions (3157.80 + 300 - 1000)
      totalNet: 1860,
      status: 'partially_paid' as const,
      paymentDate: new Date('2024-11-30'),
      tasksCompleted: 2,
      qualityScore: 90, // Średnia z quality approvals (100% + 80%) / 2
      netPay: 1860,
      baseSalary: 0,
      apartmentsCompleted: ['1A', '1B'],
      paymentMethod: 'transfer',
      hoursWorked: 0, // Płatność za metry, nie godziny
      hourlyRate: 0
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Anna Nowak',
      employeePosition: 'Tynkarz cementowo-wapienny',
      period: '2024-11',
      
      // Measurement-based payment system
      workCompleted: [
        {
          apartmentId: '3A',
          apartmentNumber: '3A',
          taskType: 'Tynki cementowo-wapienne zewnętrzne',
          metersSquare: 112.5,
          metersLinear: 28.3, // metry cokołów
          ratePerSquareMeter: 22, // Wyższa stawka dla tynków zewnętrznych
          ratePerLinearMeter: 18,
          estimatedAmount: 2984.40, // 112.5 × 22 + 28.3 × 18
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-25'),
            metersVerified: 112.5,
            qualityApprovalPercent: 100,
            approvedAmount: 2984.40,
            feedback: 'Tynki cementowo-wapienne wykonane zgodnie z technologią. Dobra przyczepność, równa struktura.',
            status: 'approved' as const
          }
        },
        {
          apartmentId: '3B',
          apartmentNumber: '3B', 
          taskType: 'Tynki cementowo-wapienne zewnętrzne',
          metersSquare: 98.7,
          metersLinear: 22.6,
          ratePerSquareMeter: 22,
          ratePerLinearMeter: 18,
          estimatedAmount: 2577.20, // 98.7 × 22 + 22.6 × 18
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: null, // Jeszcze nie sprawdzone
            metersVerified: null,
            qualityApprovalPercent: 0,
            approvedAmount: 0,
            feedback: null,
            status: 'pending_review' as const
          }
        }
      ],
      
      baseWage: 0,
      totalEstimated: 5561.60, // 2984.40 + 2577.20
      totalApproved: 2984.40, 
      totalPending: 2577.20, // Oczekuje na kontrolę jakości
      bonuses: [
        {
          id: 'b3',
          type: 'attendance' as const,
          amount: 200,
          description: 'Premia za obecność'
        }
      ],
      deductions: [],
      
      totalGross: 3184.40, // totalApproved + bonuses (2984.40 + 200)
      totalNet: 2410,
      status: 'processing' as const, // Częściowo wypłacone, oczekuje na kontrolę
      paymentDate: null,
      tasksCompleted: 2,
      qualityScore: 100, // Tylko z zatwierdzonych
      netPay: 2410,
      baseSalary: 0,
      apartmentsCompleted: ['3A'], // Tylko zatwierdzone
      paymentMethod: 'transfer',
      hoursWorked: 0, // Płatność za metry, nie godziny
      hourlyRate: 0
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'Piotr Wiśniewski',
      employeePosition: 'Tynkarz wielofunkcyjny',
      period: '2024-11',
      
      // Measurement-based payment system
      workCompleted: [
        {
          apartmentId: '2B',
          apartmentNumber: '2B',
          taskType: 'Tynki specjalistyczne dekoracyjne',
          metersSquare: 45.2,
          metersLinear: 38.5, // metry detali architektonicznych
          ratePerSquareMeter: 25, // Wysoka stawka dla tynków specjalistycznych
          ratePerLinearMeter: 20,
          estimatedAmount: 1900.00, // 45.2 × 25 + 38.5 × 20
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-22'),
            metersVerified: 45.2,
            qualityApprovalPercent: 0, // 0% - praca odrzucona
            approvedAmount: 0,
            feedback: 'Tynki dekoracyjne nie spełniają standardów jakości. Nierówna struktura, błędy w wzorze.',
            correctionsNeeded: 'Zeszlifować i wykonać ponownie tynki dekoracyjne zgodnie z wzorem, poprawić wykończenie detali.',
            revisionDeadline: new Date('2024-12-10'),
            status: 'rejected' as const
          }
        },
        {
          apartmentId: '2C',
          apartmentNumber: '2C',
          taskType: 'Tynki specjalistyczne + sztukateria', 
          metersSquare: 52.8,
          metersLinear: 28.7, // metry sztukaterii
          ratePerSquareMeter: 25,
          ratePerLinearMeter: 20,
          estimatedAmount: 1894.00, // 52.8 × 25 + 28.7 × 20
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-24'),
            metersVerified: 52.8,
            qualityApprovalPercent: 70, // 70% zatwierdzonych
            approvedAmount: 1325.80, // (52.8 × 25 + 28.7 × 20) × 70%
            pendingAmount: 568.20, // Pozostałe 30%
            feedback: 'Tynki specjalistyczne w większości prawidłowe. Sztukateria wymaga dokończenia w niektórych miejscach.',
            correctionsNeeded: 'Dokończyć detale sztukaterii przy suficie, poprawić wykończenie narożników.',
            revisionDeadline: new Date('2024-12-08'),
            status: 'partially_approved' as const
          }
        }
      ],
      
      baseWage: 0,
      totalEstimated: 3794.00, // 1900.00 + 1894.00
      totalApproved: 1325.80, // Tylko z 2C
      totalPending: 568.20, // Pozostałe 30% z 2C
      totalRejected: 1900.00, // Cała praca z 2B
      bonuses: [],
      deductions: [
        {
          id: 'd2',
          type: 'other' as const,
          amount: 200,
          description: 'Koszt materiałów do poprawek'
        }
      ],
      
      totalGross: 1125.80, // totalApproved - deductions (1325.80 - 200)
      totalNet: 850,
      status: 'pending' as const, // Oczekuje na poprawki
      paymentDate: null,
      tasksCompleted: 2,
      qualityScore: 35, // (0% + 70%) / 2
      netPay: 850,
      baseSalary: 0,
      apartmentsCompleted: [], // Brak w pełni zatwierdzonych
      paymentMethod: 'transfer',
      hoursWorked: 0, // Płatność za metry, nie godziny
      hourlyRate: 0
    },
    {
      id: '4',
      employeeId: '4',
      employeeName: 'Maria Kaczmarek',
      employeePosition: 'Tynkarz gipsowy',
      period: '2024-11',
      
      // Measurement-based payment system
      workCompleted: [
        {
          apartmentId: '4A',
          apartmentNumber: '4A',
          taskType: 'Tynki gipsowe standardowe',
          metersSquare: 156.8,
          metersLinear: 45.2, // metry przejść
          ratePerSquareMeter: 16,
          ratePerLinearMeter: 12,
          estimatedAmount: 3051.20, // 156.8 × 16 + 45.2 × 12
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-26'),
            metersVerified: 156.8,
            qualityApprovalPercent: 100,
            approvedAmount: 3051.20,
            feedback: 'Tynki gipsowe wykonane bardzo dobrze. Równa powierzchnia, gotowa do malowania.',
            status: 'approved' as const
          }
        },
        {
          apartmentId: '4B',
          apartmentNumber: '4B',
          taskType: 'Tynki gipsowe standardowe',
          metersSquare: 142.3,
          metersLinear: 38.7,
          ratePerSquareMeter: 16,
          ratePerLinearMeter: 12,
          estimatedAmount: 2741.20, // 142.3 × 16 + 38.7 × 12
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-28'),
            metersVerified: 142.3,
            qualityApprovalPercent: 100,
            approvedAmount: 2741.20,
            feedback: 'Wysoka jakość wykonania. Powierzchnia przygotowana do dalszych prac.',
            status: 'approved' as const
          }
        }
      ],
      
      baseWage: 0,
      totalEstimated: 5792.40,
      totalApproved: 5792.40,
      totalPending: 0,
      bonuses: [
        {
          id: 'b4',
          type: 'quality' as const,
          amount: 400,
          description: 'Premia za jakość tynków'
        }
      ],
      deductions: [],
      totalGross: 6192.40,
      totalNet: 4680,
      status: 'paid' as const,
      paymentDate: new Date('2024-11-30'),
      tasksCompleted: 2,
      qualityScore: 100,
      netPay: 4680,
      baseSalary: 0,
      apartmentsCompleted: ['4A', '4B'],
      paymentMethod: 'transfer',
      hoursWorked: 0, // Płatność za metry, nie godziny
      hourlyRate: 0
    },
    {
      id: '5',
      employeeId: '5',
      employeeName: 'Tomasz Lewandowski',
      employeePosition: 'Pomocnik tynkarza',
      period: '2024-11',
      
      // Measurement-based payment system
      workCompleted: [
        {
          apartmentId: '1C',
          apartmentNumber: '1C',
          taskType: 'Przygotowanie podłoża pod tynki',
          metersSquare: 78.5,
          metersLinear: 32.4, // metry przygotowania krawędzi
          ratePerSquareMeter: 8, // Niska stawka dla prac pomocniczych
          ratePerLinearMeter: 6,
          estimatedAmount: 822.40, // 78.5 × 8 + 32.4 × 6
          
          qualityControl: {
            coordinatorId: 'coord-1',
            coordinatorName: 'Anna Koordynator',
            reviewDate: new Date('2024-11-20'),
            metersVerified: 78.5,
            qualityApprovalPercent: 85, // 85% zatwierdzonych
            approvedAmount: 699.04, // 822.40 × 85%
            pendingAmount: 123.36, // Pozostałe 15%
            feedback: 'Przygotowanie podłoża w większości prawidłowe. Miejscami wymaga dodatkowego oczyszczenia.',
            correctionsNeeded: 'Dokładniej oczyścić powierzchnię w narożnikach, usunąć pozostałości starego tynku.',
            revisionDeadline: new Date('2024-12-05'),
            status: 'partially_approved' as const
          }
        }
      ],
      
      baseWage: 0,
      totalEstimated: 822.40,
      totalApproved: 699.04,
      totalPending: 123.36,
      bonuses: [],
      deductions: [
        {
          id: 'd3',
          type: 'damage' as const,
          amount: 150,
          description: 'Uszkodzenie narzędzia tynkarskiego'
        }
      ],
      totalGross: 549.04, // totalApproved - deductions
      totalNet: 415,
      status: 'processing' as const,
      paymentDate: null,
      tasksCompleted: 1,
      qualityScore: 85,
      netPay: 415,
      baseSalary: 0,
      apartmentsCompleted: [], // Brak w pełni zatwierdzonych
      paymentMethod: 'cash',
      hoursWorked: 0, // Płatność za metry, nie godziny
      hourlyRate: 0
    }
  ]

  const mockSummary = {
    totalGross: mockRecords.reduce((sum, record) => sum + record.totalGross, 0),
    totalNet: mockRecords.reduce((sum, record) => sum + record.totalNet, 0),
    totalPayroll: mockRecords.reduce((sum, record) => sum + record.totalGross, 0),
    totalEmployees: mockRecords.length,
    employeeCount: mockRecords.length,
    paidRecords: mockRecords.filter(r => r.status === 'paid').length,
    paidCount: mockRecords.filter(r => r.status === 'paid').length,
    pendingRecords: mockRecords.filter(r => r.status === 'pending').length,
    pendingCount: mockRecords.filter(r => r.status === 'pending').length,
    processingRecords: mockRecords.filter(r => r.status === 'processing').length,
    averageQualityScore: Math.round(mockRecords.reduce((sum, record) => sum + record.qualityScore, 0) / mockRecords.length),
    totalTasksCompleted: mockRecords.reduce((sum, record) => sum + record.tasksCompleted, 0),
    // Obliczanie sumy metrów z wszystkich prac
    totalMetersSquare: mockRecords.reduce((sum, record) => {
      if (record.workCompleted) {
        return sum + record.workCompleted.reduce((workSum, work) => workSum + work.metersSquare, 0)
      }
      return sum
    }, 0),
    totalMetersLinear: mockRecords.reduce((sum, record) => {
      if (record.workCompleted) {
        return sum + record.workCompleted.reduce((workSum, work) => workSum + work.metersLinear, 0)
      }
      return sum
    }, 0),
    averageQualityApproval: Math.round(mockRecords.reduce((sum, record) => sum + record.qualityScore, 0) / mockRecords.length)
  }

  const records = mockRecords
  const summary = mockSummary
  const loading = false
  const error = null
  const refetch = () => Promise.resolve()

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeePosition.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRecords(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Ładowanie danych wypłat...</p>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Całkowite wypłaty</span>
            <DollarSign className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{formatCurrency(summary.totalPayroll)}</div>
          <div className="flex items-center gap-1 mt-1">
            {summary.totalPayroll > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Aktywne wypłaty</span>
              </>
            ) : (
              <span className="text-xs text-neutral-500">Brak wypłat</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Metry kwadratowe</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{summary.totalMetersSquare.toFixed(1)} m²</div>
          <div className="text-xs text-neutral-500 mt-1">
            {summary.employeeCount} tynkarzy
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Metry bieżące</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{summary.totalMetersLinear.toFixed(1)} mb</div>
          <div className="text-xs text-neutral-500 mt-1">narożniki, detale</div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Status wypłat</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {summary.paidCount} wypłacone
            </Badge>
            <Badge variant="warning" size="sm">
              {summary.pendingCount} oczekuje
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
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

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="2024-11">Listopad 2024</option>
            <option value="2024-10">Październik 2024</option>
            <option value="2024-09">Wrzesień 2024</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="paid">Wypłacone</option>
            <option value="processing">W trakcie</option>
            <option value="pending">Oczekujące</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Eksportuj
          </Button>
          <Button variant="primary" size="md">
            <CreditCard className="w-4 h-4 mr-2" />
            Procesuj wypłaty
          </Button>
        </div>
      </div>

      {/* Payroll Records */}
      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const statusConf = statusConfig[record.status]
          const StatusIcon = statusConf.icon
          const isExpanded = expandedRecords.has(record.id)

          return (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Main Record */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {record.employeeName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{record.employeeName}</h3>
                      <p className="text-sm text-neutral-600">{record.employeePosition}</p>
                    </div>
                  </div>
                  <Badge variant={statusConf.color as any} size="md" className="flex items-center gap-1">
                    <StatusIcon className="w-4 h-4" />
                    {statusConf.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Okres</p>
                    <p className="font-medium text-neutral-900">
                      {new Date(record.period).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Metry wykonane</p>
                    <p className="font-medium text-neutral-900">
                      {record.workCompleted ? 
                        `${record.workCompleted.reduce((sum, work) => sum + work.metersSquare, 0).toFixed(1)} m² + ${record.workCompleted.reduce((sum, work) => sum + work.metersLinear, 0).toFixed(1)} mb` 
                        : '0 m²'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Ocena jakości</p>
                    <p className="font-medium text-neutral-900">{record.qualityScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Do wypłaty</p>
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(record.netPay)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span>Zadania: {record.tasksCompleted}</span>
                    <span>Pomieszczenia: {record.apartmentsCompleted.join(', ')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRecordExpansion(record.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isExpanded ? 'Zwiń' : 'Szczegóły'}
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Salary Breakdown */}
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Rozliczenie pracy</h4>
                      <div className="space-y-2">
                        {record.workCompleted && record.workCompleted.map((work, index) => (
                          <div key={index} className="border-b border-neutral-100 pb-2 last:border-b-0">
                            <div className="text-xs text-neutral-500 mb-1">{work.taskType} - {work.apartmentNumber}</div>
                            {work.metersSquare > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-600">{work.metersSquare} m² × {formatCurrency(work.ratePerSquareMeter)}</span>
                                <span className="font-medium">{formatCurrency(work.metersSquare * work.ratePerSquareMeter)}</span>
                              </div>
                            )}
                            {work.metersLinear > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-600">{work.metersLinear} mb × {formatCurrency(work.ratePerLinearMeter)}</span>
                                <span className="font-medium">{formatCurrency(work.metersLinear * work.ratePerLinearMeter)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-medium mt-1">
                              <span className="text-neutral-700">Zatwierdzone ({work.qualityControl.qualityApprovalPercent}%)</span>
                              <span className="text-green-600">{formatCurrency(work.qualityControl.approvedAmount || 0)}</span>
                            </div>
                          </div>
                        ))}
                        {(!record.workCompleted || record.workCompleted.length === 0) && (
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-600">Brak zrealizowanych prac</span>
                            <span className="font-medium">{formatCurrency(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bonuses */}
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Premie</h4>
                      <div className="space-y-2">
                        {record.bonuses.map(bonus => {
                          const typeConf = bonusTypeConfig[bonus.type]
                          return (
                            <div key={bonus.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Plus className="w-3 h-3 text-green-600" />
                                <Badge variant={typeConf.color as any} size="xs">
                                  {typeConf.label}
                                </Badge>
                              </div>
                              <span className="font-medium text-green-600">
                                +{formatCurrency(bonus.amount)}
                              </span>
                            </div>
                          )
                        })}
                        {record.bonuses.length === 0 && (
                          <p className="text-sm text-neutral-500">Brak premii</p>
                        )}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Potrącenia</h4>
                      <div className="space-y-2">
                        {record.deductions.map(deduction => {
                          const typeConf = deductionTypeConfig[deduction.type]
                          return (
                            <div key={deduction.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Minus className="w-3 h-3 text-red-600" />
                                <Badge variant={typeConf.color as any} size="xs">
                                  {typeConf.label}
                                </Badge>
                              </div>
                              <span className="font-medium text-red-600">
                                -{formatCurrency(deduction.amount)}
                              </span>
                            </div>
                          )
                        })}
                        {record.deductions.length === 0 && (
                          <p className="text-sm text-neutral-500">Brak potrąceń</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {record.paymentDate && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-neutral-600">
                            Data płatności: {record.paymentDate.toLocaleDateString('pl-PL')}
                          </span>
                          <Badge variant="neutral" size="sm">
                            {record.paymentMethod === 'transfer' ? 'Przelew' :
                             record.paymentMethod === 'cash' ? 'Gotówka' : 'Czek'}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Pobierz potwierdzenie
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Brak rekordów wypłat
          </h3>
          <p className="text-neutral-600">
            Nie znaleziono rekordów wypłat spełniających kryteria wyszukiwania.
          </p>
        </div>
      )}
    </div>
  )
}