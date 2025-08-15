// Financial Data Hooks
// Custom hooks for fetching and managing financial dashboard data

import { useState, useEffect, useCallback } from 'react';
import type {
  FinancialOverview,
  FinancialMetricsCard,
  ProjectFinancialSummary,
  CashFlowData,
  CategoryBreakdown,
  KPIMetric,
  FinancialFilters,
  ProjectFinancialTableResponse
} from '@/types/finance';

// ========== Financial Overview Hook ==========

interface UseFinancialOverviewOptions {
  startDate?: Date;
  endDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface FinancialOverviewData {
  overview: FinancialOverview | null;
  metricsCards: FinancialMetricsCard[];
  kpis: KPIMetric[];
  healthScore: {
    score: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    factors: { name: string; score: number; weight: number }[];
  } | null;
}

export function useFinancialOverview(options: UseFinancialOverviewOptions = {}) {
  const [data, setData] = useState<FinancialOverviewData>({
    overview: null,
    metricsCards: [],
    kpis: [],
    healthScore: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      if (options.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }

      const response = await fetch(`/api/finance/overview?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial overview');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.startDate, options.endDate]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(
      fetchOverview,
      options.refreshInterval || 300000 // Default 5 minutes
    );

    return () => clearInterval(interval);
  }, [fetchOverview, options.autoRefresh, options.refreshInterval]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchOverview
  };
}

// ========== Project Financial Data Hook ==========

interface UseProjectFinancialDataOptions {
  filters?: {
    status?: string[];
    managerId?: string;
    startDate?: Date;
    endDate?: Date;
  };
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useProjectFinancialData(options: UseProjectFinancialDataOptions = {}) {
  const [data, setData] = useState<ProjectFinancialTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add filters
      if (options.filters?.status) {
        options.filters.status.forEach(status => params.append('status', status));
      }
      if (options.filters?.managerId) {
        params.append('managerId', options.filters.managerId);
      }
      if (options.filters?.startDate) {
        params.append('startDate', options.filters.startDate.toISOString());
      }
      if (options.filters?.endDate) {
        params.append('endDate', options.filters.endDate.toISOString());
      }

      // Add search and pagination
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/finance/projects?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project financial data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    options.filters,
    options.search,
    options.sortBy,
    options.sortOrder,
    options.page,
    options.limit
  ]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    data,
    loading,
    error,
    refetch: fetchProjects
  };
}

// ========== Cash Flow Data Hook ==========

interface UseCashFlowDataOptions {
  startDate?: Date;
  endDate?: Date;
  includePredictions?: boolean;
  predictMonths?: number;
}

interface CashFlowResponse {
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
}

export function useCashFlowData(options: UseCashFlowDataOptions = {}) {
  const [data, setData] = useState<CashFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashFlow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      if (options.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }
      if (options.includePredictions) {
        params.append('includePredictions', 'true');
      }
      if (options.predictMonths) {
        params.append('predictMonths', options.predictMonths.toString());
      }

      const response = await fetch(`/api/finance/cash-flow?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cash flow data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    options.startDate,
    options.endDate,
    options.includePredictions,
    options.predictMonths
  ]);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  return {
    data,
    loading,
    error,
    refetch: fetchCashFlow
  };
}

// ========== Category Breakdown Hook ==========

interface UseCategoryBreakdownOptions {
  startDate?: Date;
  endDate?: Date;
  type?: 'revenue' | 'expenses' | 'both';
}

interface CategoryBreakdownResponse {
  expenses: CategoryBreakdown[];
  revenue: CategoryBreakdown[];
  summary: {
    totalExpenses: number;
    totalRevenue: number;
    expenseCategories: number;
    revenueCategories: number;
  };
}

export function useCategoryBreakdown(options: UseCategoryBreakdownOptions = {}) {
  const [data, setData] = useState<CategoryBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      if (options.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }
      if (options.type) {
        params.append('type', options.type);
      }

      const response = await fetch(`/api/finance/categories?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category breakdown');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.startDate, options.endDate, options.type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    data,
    loading,
    error,
    refetch: fetchCategories
  };
}

// ========== Combined Financial Dashboard Hook ==========

interface UseFinancialDashboardOptions {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useFinancialDashboard(options: UseFinancialDashboardOptions = {}) {
  const overview = useFinancialOverview({
    startDate: options.dateRange?.startDate,
    endDate: options.dateRange?.endDate,
    autoRefresh: options.autoRefresh,
    refreshInterval: options.refreshInterval
  });

  const cashFlow = useCashFlowData({
    startDate: options.dateRange?.startDate,
    endDate: options.dateRange?.endDate,
    includePredictions: true,
    predictMonths: 6
  });

  const categories = useCategoryBreakdown({
    startDate: options.dateRange?.startDate,
    endDate: options.dateRange?.endDate,
    type: 'both'
  });

  const projects = useProjectFinancialData({
    filters: {
      startDate: options.dateRange?.startDate,
      endDate: options.dateRange?.endDate
    },
    page: 1,
    limit: 10
  });

  const loading = overview.loading || cashFlow.loading || categories.loading || projects.loading;
  const error = overview.error || cashFlow.error || categories.error || projects.error;

  const refetchAll = useCallback(() => {
    overview.refetch();
    cashFlow.refetch();
    categories.refetch();
    projects.refetch();
  }, [overview.refetch, cashFlow.refetch, categories.refetch, projects.refetch]);

  return {
    overview: {
      data: overview.overview,
      metricsCards: overview.metricsCards,
      kpis: overview.kpis,
      healthScore: overview.healthScore,
      loading: overview.loading,
      error: overview.error
    },
    cashFlow: {
      data: cashFlow.data,
      loading: cashFlow.loading,
      error: cashFlow.error
    },
    categories: {
      data: categories.data,
      loading: categories.loading,
      error: categories.error
    },
    projects: {
      data: projects.data,
      loading: projects.loading,
      error: projects.error
    },
    loading,
    error,
    refetchAll
  };
}

export default useFinancialDashboard;