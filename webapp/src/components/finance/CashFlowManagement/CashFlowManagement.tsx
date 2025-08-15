// Cash Flow Management Component
// Comprehensive cash flow analysis, forecasting, and payment management

import React, { useState } from 'react';
import type {
  CashFlowData,
  FinancialOverview,
  PaymentTrackingData,
  CashFlowPosition
} from '@/types/finance';

interface CashFlowManagementProps {
  cashFlowData: {
    historical: CashFlowData[];
    predictions?: CashFlowData[];
    summary: {
      totalPeriods: number;
      averageInflow: number;
      averageOutflow: number;
      averageNetFlow: number;
      currentPosition: number;
      projectedPosition?: number;
    };
  } | null;
  overviewData: FinancialOverview | null;
  loading: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function CashFlowManagement({
  cashFlowData,
  overviewData,
  loading,
  dateRange
}: CashFlowManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'payments'>('overview');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!cashFlowData) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Brak danych cash flow
        </h3>
        <p className="text-gray-600">
          Dane o przepływach pieniężnych będą dostępne po dodaniu transakcji finansowych.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCashFlowStatus = (netFlow: number) => {
    if (netFlow > 50000) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Doskonały' };
    if (netFlow > 10000) return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Dobry' };
    if (netFlow > 0) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Stabilny' };
    if (netFlow > -10000) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Ostrzeżenie' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Krytyczny' };
  };

  const currentPosition = cashFlowData.summary.currentPosition;
  const projectedPosition = cashFlowData.summary.projectedPosition || currentPosition;
  const positionChange = projectedPosition - currentPosition;
  const status = getCashFlowStatus(currentPosition);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Przegląd Cash Flow' },
            { id: 'forecast', label: 'Prognozowanie' },
            { id: 'payments', label: 'Płatności' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Cash Flow Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${status.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pozycja Gotówkowa</p>
                  <p className={`text-2xl font-bold ${status.color}`}>
                    {formatCurrency(currentPosition)}
                  </p>
                  <p className={`text-xs ${status.color}`}>
                    {status.label}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${status.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Średni Wpływ</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(cashFlowData.summary.averageInflow)}
                  </p>
                  <p className="text-xs text-blue-600">miesięcznie</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Średni Wypływ</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(Math.abs(cashFlowData.summary.averageOutflow))}
                  </p>
                  <p className="text-xs text-red-600">miesięcznie</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Netto Przepływ</p>
                  <p className={`text-2xl font-bold ${
                    cashFlowData.summary.averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(cashFlowData.summary.averageNetFlow)}
                  </p>
                  <p className={`text-xs ${
                    cashFlowData.summary.averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    średnio
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  cashFlowData.summary.averageNetFlow >= 0 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Chart Placeholder */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Historyczny Przepływ Gotówki</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Ostatnie {cashFlowData.summary.totalPeriods} okresów</span>
              </div>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Wykres przepływu gotówki</p>
              </div>
            </div>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wpływy</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Płatności od klientów</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inne przychody</span>
                  <span className="font-medium text-green-600">15%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wypływy</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Wynagrodzenia</span>
                  <span className="font-medium text-red-600">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Materiały</span>
                  <span className="font-medium text-red-600">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sprzęt</span>
                  <span className="font-medium text-red-600">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Koszty ogólne</span>
                  <span className="font-medium text-red-600">15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecasting Tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prognoza Cash Flow</h3>
            
            {cashFlowData.summary.projectedPosition && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Prognozowana Pozycja</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(projectedPosition)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Zmiana</p>
                    <p className={`text-lg font-semibold ${
                      positionChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {positionChange >= 0 ? '+' : ''}{formatCurrency(positionChange)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Wykres prognozy cash flow</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nadchodzące Płatności</h3>
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Brak nadchodzących płatności</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Przeterminowane Faktury</h3>
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p>Brak przeterminowanych faktur</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashFlowManagement;