'use client'

import React from 'react'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Target, BarChart3, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectFinancialOverviewProps {
  projectId: string
}

// Mock financial data for a plastering project
const generateMockProjectFinancials = (projectId: string) => {
  const baseValue = Math.random() * 300000 + 200000 // 200K - 500K PLN
  
  return {
    budget: {
      original: baseValue,
      current: baseValue * (0.95 + Math.random() * 0.1), // ±5% variance
      spent: baseValue * (0.4 + Math.random() * 0.4), // 40-80% spent
      remaining: baseValue * (0.2 + Math.random() * 0.6)
    },
    costs: {
      labor: baseValue * 0.45, // 45% for labor (typical for plastering)
      materials: baseValue * 0.35, // 35% for materials
      equipment: baseValue * 0.12, // 12% for equipment
      transport: baseValue * 0.08 // 8% for transport
    },
    revenue: {
      invoiced: baseValue * (0.3 + Math.random() * 0.4),
      pending: baseValue * (0.2 + Math.random() * 0.3),
      received: baseValue * (0.2 + Math.random() * 0.3)
    },
    profitability: {
      grossMargin: 15 + Math.random() * 10, // 15-25%
      netMargin: 8 + Math.random() * 7, // 8-15%
      roi: 12 + Math.random() * 8 // 12-20%
    },
    timeline: {
      plannedCompletion: new Date('2024-08-15'),
      actualProgress: 65 + Math.random() * 25, // 65-90%
      onSchedule: Math.random() > 0.3
    }
  }
}

export function ProjectFinancialOverview({ projectId }: ProjectFinancialOverviewProps) {
  const financials = generateMockProjectFinancials(projectId)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getBudgetStatus = () => {
    const utilization = (financials.budget.spent / financials.budget.current) * 100
    if (utilization > 90) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' }
    if (utilization > 75) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { status: 'healthy', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  const budgetStatus = getBudgetStatus()

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Overview */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-sm font-medium text-neutral-700">Budżet projektu</h3>
            </div>
            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", budgetStatus.bgColor, budgetStatus.color)}>
              {budgetStatus.status === 'healthy' ? 'W normie' : 
               budgetStatus.status === 'warning' ? 'Uwaga' : 'Przekroczony'}
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatCurrency(financials.budget.current)}
          </div>
          <div className="text-sm text-neutral-600">
            Wykorzystano: {formatCurrency(financials.budget.spent)}
          </div>
          <div className="mt-3 w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((financials.budget.spent / financials.budget.current) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Revenue Status */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-sm font-medium text-neutral-700">Przychody</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatCurrency(financials.revenue.received)}
          </div>
          <div className="text-sm text-neutral-600 mb-2">
            Oczekujące: {formatCurrency(financials.revenue.pending)}
          </div>
          <div className="flex items-center text-xs">
            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            <span className="text-green-600">Na czas</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-sm font-medium text-neutral-700">Marża zysku</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatPercentage(financials.profitability.grossMargin)}
          </div>
          <div className="text-sm text-neutral-600 mb-2">
            Netto: {formatPercentage(financials.profitability.netMargin)}
          </div>
          <div className="flex items-center text-xs">
            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            <span className="text-green-600">Powyżej celu</span>
          </div>
        </div>

        {/* Progress vs Budget */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-sm font-medium text-neutral-700">Postęp vs Budżet</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatPercentage(financials.timeline.actualProgress)}
          </div>
          <div className="text-sm text-neutral-600 mb-2">
            Postęp fizyczny
          </div>
          <div className="flex items-center text-xs">
            {financials.timeline.onSchedule ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-600">Zgodnie z planem</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-yellow-600">Opóźnienie</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center mb-4">
          <PieChart className="w-5 h-5 text-neutral-600 mr-2" />
          <h3 className="text-lg font-semibold text-neutral-900">Struktura kosztów</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              { label: 'Robocizna', value: financials.costs.labor, color: 'bg-blue-500', percentage: 45 },
              { label: 'Materiały tynkarskie', value: financials.costs.materials, color: 'bg-green-500', percentage: 35 },
              { label: 'Sprzęt i narzędzia', value: financials.costs.equipment, color: 'bg-yellow-500', percentage: 12 },
              { label: 'Transport i logistyka', value: financials.costs.transport, color: 'bg-purple-500', percentage: 8 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={cn("w-3 h-3 rounded-full mr-3", item.color)} />
                  <span className="text-sm font-medium text-neutral-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Simple pie chart representation */}
              <div className="w-full h-full rounded-full border-8 border-blue-500 border-r-green-500 border-b-yellow-500 border-l-purple-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-neutral-900">
                    {formatCurrency(Object.values(financials.costs).reduce((a, b) => a + b, 0))}
                  </div>
                  <div className="text-xs text-neutral-500">Łączne koszty</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-neutral-600 mr-2" />
          <h3 className="text-lg font-semibold text-neutral-900">Wskaźniki finansowe</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Rentowność</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Marża brutto:</span>
                <span className="text-sm font-medium text-neutral-900">{formatPercentage(financials.profitability.grossMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Marża netto:</span>
                <span className="text-sm font-medium text-neutral-900">{formatPercentage(financials.profitability.netMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">ROI:</span>
                <span className="text-sm font-medium text-neutral-900">{formatPercentage(financials.profitability.roi)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Budżet</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Budżet pierwotny:</span>
                <span className="text-sm font-medium text-neutral-900">{formatCurrency(financials.budget.original)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Budżet aktualny:</span>
                <span className="text-sm font-medium text-neutral-900">{formatCurrency(financials.budget.current)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Pozostało:</span>
                <span className="text-sm font-medium text-neutral-900">{formatCurrency(financials.budget.remaining)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Harmonogram</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Postęp fizyczny:</span>
                <span className="text-sm font-medium text-neutral-900">{formatPercentage(financials.timeline.actualProgress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Status:</span>
                <span className={cn("text-sm font-medium", financials.timeline.onSchedule ? "text-green-600" : "text-yellow-600")}>
                  {financials.timeline.onSchedule ? 'Na czas' : 'Opóźnienie'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Planowe zakończenie:</span>
                <span className="text-sm font-medium text-neutral-900">
                  {financials.timeline.plannedCompletion.toLocaleDateString('pl-PL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-neutral-600 mr-2" />
            <h3 className="text-lg font-semibold text-neutral-900">Status płatności</h3>
          </div>
          <div className="text-sm text-neutral-500">
            Aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">Otrzymane płatności</div>
            <div className="text-xl font-bold text-green-900">{formatCurrency(financials.revenue.received)}</div>
            <div className="text-xs text-green-600 mt-1">✓ Zaksięgowane</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-700 mb-1">Oczekujące płatności</div>
            <div className="text-xl font-bold text-yellow-900">{formatCurrency(financials.revenue.pending)}</div>
            <div className="text-xs text-yellow-600 mt-1">⏳ Oczekuje na płatność</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">Wystawione faktury</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(financials.revenue.invoiced)}</div>
            <div className="text-xs text-blue-600 mt-1">📄 Do wystawienia</div>
          </div>
        </div>
      </div>
    </div>
  )
}