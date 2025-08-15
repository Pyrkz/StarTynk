'use client';

import { useState } from 'react';
import { CalendarIcon, DownloadIcon, RefreshCwIcon, SettingsIcon } from 'lucide-react';
import { GlobalFinanceDashboard } from '@/components/finance/GlobalFinanceDashboard/GlobalFinanceDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import useFinancialDashboard from '@/hooks/useFinancialData'; // TODO: Przywrócić po zakończeniu testów
import useFinancialDashboard from '@/hooks/useMockFinancialData'; // Tymczasowe dane mockowe

export default function FinancePage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date() // Today
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    overview,
    cashFlow,
    categories,
    projects,
    loading,
    error,
    refetchAll
  } = useFinancialDashboard({
    dateRange,
    autoRefresh,
    refreshInterval: 300000 // 5 minutes
  });

  const handleDateRangeChange = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (preset) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStart, 1);
        break;
      case 'lastQuarter':
        const lastQuarterStart = Math.floor(today.getMonth() / 3) * 3 - 3;
        startDate = new Date(today.getFullYear(), lastQuarterStart, 1);
        endDate = new Date(today.getFullYear(), lastQuarterStart + 3, 0);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), 0, 1);
    }

    setDateRange({ startDate, endDate });
  };

  if (loading && !overview.data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finanse - Przegląd Globalny</h1>
        </div>
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded"></div>
            </Card>
            <Card className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded"></div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview.data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finanse - Przegląd Globalny</h1>
          <Button onClick={refetchAll} variant="outline">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Błąd ładowania danych finansowych</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetchAll}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Spróbuj ponownie
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanse - Przegląd Globalny</h1>
          <p className="text-gray-600 mt-1">
            Kompleksowy przegląd finansowy wszystkich projektów i operacji firmy
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => handleDateRangeChange(e.target.value)}
              defaultValue="thisYear"
            >
              <option value="thisMonth">Ten miesiąc</option>
              <option value="lastMonth">Ostatni miesiąc</option>
              <option value="thisQuarter">Ten kwartał</option>
              <option value="lastQuarter">Ostatni kwartał</option>
              <option value="thisYear">Ten rok</option>
              <option value="lastYear">Ostatni rok</option>
            </select>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-md border transition-colors ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
            title={autoRefresh ? 'Automatyczne odświeżanie włączone' : 'Automatyczne odświeżanie wyłączone'}
          >
            <RefreshCwIcon className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>

          {/* Manual refresh */}
          <Button
            onClick={refetchAll}
            variant="outline"
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>

          {/* Export data */}
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Eksport
          </Button>

          {/* Settings */}
          <Button variant="outline">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <RefreshCwIcon className="h-4 w-4 text-blue-600 animate-spin mr-2" />
            <span className="text-blue-800 text-sm">Aktualizowanie danych finansowych...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span className="text-red-800 text-sm">Błąd podczas ładowania: {error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={refetchAll}>
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      )}

      {/* Main dashboard */}
      <GlobalFinanceDashboard
        overviewData={overview.data}
        metricsCards={overview.metricsCards}
        kpis={overview.kpis}
        healthScore={overview.healthScore}
        cashFlowData={cashFlow.data}
        categoryData={categories.data}
        projectsData={projects.data}
        loading={loading}
        dateRange={dateRange}
      />
    </div>
  );
}