// Global Finance Dashboard Component
// Main component orchestrating all financial dashboard sections

import React from 'react';
import { FinancialMetricsCards } from '../FinancialMetricsCards/FinancialMetricsCards';
import { FinancialChartsSection } from '../FinancialChartsSection/FinancialChartsSection';
import { ProjectsFinancialTable } from '../ProjectsFinancialTable/ProjectsFinancialTable';
import { CashFlowManagement } from '../CashFlowManagement/CashFlowManagement';
import type {
  FinancialOverview,
  FinancialMetricsCard,
  KPIMetric,
  CashFlowData,
  CategoryBreakdown,
  ProjectFinancialTableResponse
} from '@/types/finance';

interface GlobalFinanceDashboardProps {
  overviewData: FinancialOverview | null;
  metricsCards: FinancialMetricsCard[];
  kpis: KPIMetric[];
  healthScore: {
    score: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    factors: { name: string; score: number; weight: number }[];
  } | null;
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
  categoryData: {
    expenses: CategoryBreakdown[];
    revenue: CategoryBreakdown[];
    summary: {
      totalExpenses: number;
      totalRevenue: number;
      expenseCategories: number;
      revenueCategories: number;
    };
  } | null;
  projectsData: ProjectFinancialTableResponse | null;
  loading: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function GlobalFinanceDashboard({
  overviewData,
  metricsCards,
  kpis,
  healthScore,
  cashFlowData,
  categoryData,
  projectsData,
  loading,
  dateRange
}: GlobalFinanceDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Financial Overview Header - Key Metrics Cards */}
      <section aria-labelledby="financial-overview">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="financial-overview" className="text-xl font-bold text-gray-900">
              Przegląd Finansowy
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kluczowe wskaźniki finansowe firmy
            </p>
          </div>
          {healthScore && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Ocena finansowa:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                healthScore.rating === 'excellent' ? 'bg-green-100 text-green-800' :
                healthScore.rating === 'good' ? 'bg-blue-100 text-blue-800' :
                healthScore.rating === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                healthScore.rating === 'poor' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {healthScore.score}/100
              </div>
            </div>
          )}
        </div>
        
        <FinancialMetricsCards 
          metricsCards={metricsCards}
          loading={loading}
        />
      </section>

      {/* Revenue & Expense Analytics */}
      <section aria-labelledby="financial-analytics">
        <div className="mb-6">
          <h2 id="financial-analytics" className="text-xl font-bold text-gray-900">
            Analityka Przychodów i Kosztów
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Interaktywne wykresy trendów finansowych i analiza kategorii
          </p>
        </div>
        
        <FinancialChartsSection
          overviewData={overviewData}
          cashFlowData={cashFlowData}
          categoryData={categoryData}
          kpis={kpis}
          loading={loading}
          dateRange={dateRange}
        />
      </section>

      {/* Projects Financial Table */}
      <section aria-labelledby="projects-financial">
        <div className="mb-6">
          <h2 id="projects-financial" className="text-xl font-bold text-gray-900">
            Przegląd Finansowy Projektów
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Kompleksowe zestawienie finansowe wszystkich aktywnych i zakończonych projektów
          </p>
        </div>
        
        <ProjectsFinancialTable
          projectsData={projectsData}
          loading={loading}
        />
      </section>

      {/* Cash Flow Management */}
      <section aria-labelledby="cash-flow-management">
        <div className="mb-6">
          <h2 id="cash-flow-management" className="text-xl font-bold text-gray-900">
            Zarządzanie Przepływami Pieniężnymi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Analiza cash flow, prognozowanie i zarządzanie płatnościami
          </p>
        </div>
        
        <CashFlowManagement
          cashFlowData={cashFlowData}
          overviewData={overviewData}
          loading={loading}
          dateRange={dateRange}
        />
      </section>

      {/* KPI Summary (if available) */}
      {kpis.length > 0 && (
        <section aria-labelledby="kpi-summary" className="bg-gray-50 rounded-lg p-6">
          <div className="mb-4">
            <h2 id="kpi-summary" className="text-xl font-bold text-gray-900">
              Kluczowe Wskaźniki Wydajności
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitoring głównych wskaźników biznesowych
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">{kpi.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    kpi.status === 'good' ? 'bg-green-400' :
                    kpi.status === 'warning' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                </div>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.value.toFixed(kpi.unit === '%' ? 1 : 0)}
                  </span>
                  <span className="text-sm text-gray-500">{kpi.unit}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Target: {kpi.target}{kpi.unit}
                  </span>
                  <div className={`flex items-center gap-1 ${
                    kpi.trend.direction === 'up' ? 'text-green-600' :
                    kpi.trend.direction === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {kpi.trend.direction === 'up' ? '↗' : 
                     kpi.trend.direction === 'down' ? '↘' : '→'}
                    <span>{kpi.trend.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Financial Health Breakdown (if available) */}
      {healthScore && (
        <section aria-labelledby="health-breakdown" className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <h2 id="health-breakdown" className="text-xl font-bold text-gray-900">
              Szczegółowa Ocena Kondycji Finansowej
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analiza czynników wpływających na ogólną kondycję finansową firmy
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ocena: {healthScore.score}/100
              </h3>
              <div className="space-y-3">
                {healthScore.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">
                      {factor.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, factor.score)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8">
                        {Math.round(factor.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rekomendacje
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {healthScore.rating === 'excellent' ? (
                  <>
                    <p>✅ Doskonała kondycja finansowa</p>
                    <p>• Kontynuuj obecne strategie zarządzania</p>
                    <p>• Rozważ ekspansję lub inwestycje</p>
                  </>
                ) : healthScore.rating === 'good' ? (
                  <>
                    <p>✅ Dobra kondycja finansowa</p>
                    <p>• Monitor cash flow więcej regularnie</p>
                    <p>• Optymalizuj koszty operacyjne</p>
                  </>
                ) : healthScore.rating === 'fair' ? (
                  <>
                    <p>⚠️ Średnia kondycja finansowa</p>
                    <p>• Przeanalizuj główne źródła kosztów</p>
                    <p>• Popraw efektywność projektów</p>
                  </>
                ) : (
                  <>
                    <p>🚨 Wymagane działania naprawcze</p>
                    <p>• Natychmiastowa analiza cash flow</p>
                    <p>• Przegląd wszystkich kosztów</p>
                    <p>• Konsultacja z doradcą finansowym</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default GlobalFinanceDashboard;