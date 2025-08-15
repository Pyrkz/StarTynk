'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit3, MapPin, Building2, DollarSign, Users, Search, Plus, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useProjectDetail, useApartmentFilters } from '@/features/projekty/hooks'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/features/projekty/constants'
import { ProjectDeliveriesTab } from '@/features/deliveries/components'
import { TabNavigation } from '@/features/projekty/components/TabNavigation'
import { TeamOverview } from '@/features/projekty/components/TeamOverview'
import { PayrollEarnings } from '@/features/projekty/components/PayrollEarnings'
import { ProjectFinancialOverview } from '@/features/projekty/components/ProjectFinancialOverview'
import { QualityControlDashboard } from '@/features/quality-control/components/QualityControlDashboard'
import ProjectMaterialsSubTab from '@/features/projects/components/MaterialsOrdersTab/ProjectMaterialsSubTab'
import ActiveOrdersSubTab from '@/features/projects/components/MaterialsOrdersTab/ActiveOrdersSubTab'
import MobileRequestsSubTab from '@/features/projects/components/MaterialsOrdersTab/MobileRequestsSubTab'
import UsageAnalyticsSubTab from '@/features/projects/components/MaterialsOrdersTab/UsageAnalyticsSubTab'

const statusConfig = {
  not_started: {
    label: 'Nie rozpoczęto',
    color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    badgeVariant: 'neutral' as const,
    progressColor: 'bg-neutral-300'
  },
  in_progress: {
    label: 'W trakcie',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeVariant: 'primary' as const,
    progressColor: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  ready_for_inspection: {
    label: 'Gotowe do odbioru',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    badgeVariant: 'warning' as const,
    progressColor: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  },
  approved: {
    label: 'Zatwierdzone',
    color: 'bg-green-100 text-green-700 border-green-200',
    badgeVariant: 'success' as const,
    progressColor: 'bg-gradient-to-r from-green-500 to-green-600'
  }
}


export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.slug as string
  const [activeTab, setActiveTab] = useState('apartments')
  
  // Use real API hook
  const { project, metrics, apartments, loading, error, refetch } = useProjectDetail(projectId)
  
  // Use apartment filtering hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredApartments,
    statusCounts
  } = useApartmentFilters(apartments)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Ładowanie danych projektu...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Wystąpił problem
          </h2>
          <p className="text-neutral-600 mb-4">
            {error || 'Nie udało się załadować danych projektu'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <Button variant="primary" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-elevation-medium p-6 mb-6">
          {/* Back Navigation */}
          <div className="mb-4">
            <Link href="/dashboard/projekty">
              <Button variant="ghost" size="sm" className="group">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                Powrót do projektów
              </Button>
            </Link>
          </div>

          {/* Project Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{project.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-neutral-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {project.address}
                </div>
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  {project.developer.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={PROJECT_STATUS_COLORS[project.status]} size="md">
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Button variant="primary" size="md">
                <Edit3 className="w-4 h-4 mr-2" />
                Edytuj projekt
              </Button>
            </div>
          </div>

          {/* Project Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">Postęp projektu</span>
              <span className="text-sm font-semibold text-neutral-900">{metrics?.completionProgress || 0}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${metrics?.completionProgress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-elevation-low p-4">
            <div className="text-sm text-neutral-600 mb-1">Data rozpoczęcia</div>
            <div className="text-lg font-semibold text-neutral-900">{formatDate(project.startDate.toString())}</div>
          </div>
          <div className="bg-white rounded-lg shadow-elevation-low p-4">
            <div className="text-sm text-neutral-600 mb-1">Data zakończenia</div>
            <div className="text-lg font-semibold text-neutral-900">{formatDate(project.endDate.toString())}</div>
          </div>
          <div className="bg-white rounded-lg shadow-elevation-low p-4">
            <div className="text-sm text-neutral-600 mb-1">Wartość całkowita</div>
            <div className="text-lg font-semibold text-neutral-900">{formatCurrency(metrics?.totalValue || 0)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-elevation-low p-4">
            <div className="text-sm text-neutral-600 mb-1">Kwota wypłacona</div>
            <div className="text-lg font-semibold text-neutral-900">{formatCurrency(metrics?.paidAmount || 0)}</div>
            <div className="mt-1">
              <div className="text-xs text-neutral-500">
                {metrics?.paymentProgress || 0}% wypłacone
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-elevation-low mb-6 relative" style={{ overflow: 'visible', zIndex: 10 }}>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content - Apartments & Tasks */}
          {activeTab === 'apartments' && (
            <div className="p-6">
              {/* Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Szukaj pomieszczeń..."
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
                    <option value="not_started">Nie rozpoczęto</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="ready_for_inspection">Gotowe do odbioru</option>
                    <option value="approved">Zatwierdzone</option>
                  </select>
                </div>

                {/* Add New Button */}
                <Button variant="primary" size="md">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj pomieszczenie
                </Button>
              </div>

              {/* Pomieszczenia Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredApartments.map((apartment) => {
                  const config = statusConfig[apartment.status]
                  return (
                    <div 
                      key={apartment.id}
                      className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-elevation-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900">{apartment.number}</h3>
                          <p className="text-sm text-neutral-600">Piętro {apartment.floor}</p>
                        </div>
                        <Badge variant={config.badgeVariant} size="md">
                          {config.label}
                        </Badge>
                      </div>

                      {/* Employee Assignment */}
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          {apartment.assignedUser ? (
                            <span className="text-sm font-medium text-primary-700">
                              {apartment.assignedUser.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          ) : (
                            <Users className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {apartment.assignedUser?.name || 'Nieprzypisane'}
                          </div>
                          {apartment.assignedUser && (
                            <div className="text-xs text-neutral-500">Wykonawca</div>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-neutral-700">Postęp</span>
                          <span className="text-sm font-semibold text-neutral-900">{apartment.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-500", config.progressColor)}
                            style={{ width: `${apartment.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Task Summary */}
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-neutral-600">Zadania:</span>
                          <span className="ml-1 font-medium text-neutral-900">
                            {apartment.tasksCompleted}/{apartment.totalTasks}
                          </span>
                        </div>
                        <button className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Team Overview Tab */}
          {activeTab === 'team-overview' && (
            <TeamOverview projectId={projectId} />
          )}

          {/* Payroll & Earnings Tab */}
          {activeTab === 'payroll-earnings' && (
            <PayrollEarnings projectId={projectId} />
          )}

          {/* Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="p-6">
              <ProjectDeliveriesTab 
                projectId={projectId} 
                projectName={project.name}
              />
            </div>
          )}

          {/* Project Materials Tab */}
          {activeTab === 'project-materials' && (
            <div className="p-6">
              <ProjectMaterialsSubTab projectId={projectId} />
            </div>
          )}

          {/* Active Orders Tab */}
          {activeTab === 'active-orders' && (
            <div className="p-6">
              <ActiveOrdersSubTab projectId={projectId} />
            </div>
          )}

          {/* Mobile Requests Tab */}
          {activeTab === 'mobile-requests' && (
            <div className="p-6">
              <MobileRequestsSubTab projectId={projectId} />
            </div>
          )}

          {/* Usage Analytics Tab */}
          {activeTab === 'usage-analytics' && (
            <div className="p-6">
              <UsageAnalyticsSubTab projectId={projectId} />
            </div>
          )}

          {/* Quality Control Tab */}
          {activeTab === 'quality' && (
            <div className="p-6">
              <QualityControlDashboard />
            </div>
          )}

          {/* Financial Overview Tab */}
          {activeTab === 'finance' && (
            <div className="p-6">
              <ProjectFinancialOverview projectId={projectId} />
            </div>
          )}

          {/* Other tab contents would go here */}
          {activeTab !== 'apartments' && activeTab !== 'team-overview' && activeTab !== 'payroll-earnings' && activeTab !== 'deliveries' && activeTab !== 'project-materials' && activeTab !== 'active-orders' && activeTab !== 'mobile-requests' && activeTab !== 'usage-analytics' && activeTab !== 'quality' && activeTab !== 'finance' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-neutral-500 mb-2">Zawartość dla tej zakładki</div>
                <div className="text-sm text-neutral-400">Zostanie zaimplementowana w następnej iteracji</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}