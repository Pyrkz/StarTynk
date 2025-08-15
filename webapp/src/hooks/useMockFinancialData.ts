// Mock Financial Data Hooks
// Temporary mock data for financial dashboard

import { useState, useEffect, useCallback } from 'react';
import type {
  FinancialOverview,
  FinancialMetricsCard,
  ProjectFinancialSummary,
  CashFlowData,
  CategoryBreakdown,
  KPIMetric,
  ProjectFinancialTableResponse
} from '@/types/finance';

// Helper to create Decimal-like objects for mock data
const mockDecimal = (value: number): any => {
  return {
    toNumber: () => value,
    toString: () => value.toString(),
    toFixed: (places: number) => value.toFixed(places),
    valueOf: () => value
  };
};

// Mock Financial Overview Data
const mockFinancialOverview: FinancialOverview = {
  totalRevenue: mockDecimal(1850000),
  totalExpenses: mockDecimal(1420000),
  netProfit: mockDecimal(430000),
  profitMargin: 23.2,
  activeProjectsValue: mockDecimal(3200000),
  activeProjectsCount: 12,
  pipelineValue: mockDecimal(5600000),
  yearOverYearGrowth: {
    revenue: 15.8,
    expenses: 12.3,
    profit: 22.5
  }
};

// Mock Metrics Cards
const mockMetricsCards: FinancialMetricsCard[] = [
  {
    id: '1',
    title: 'Przychody',
    value: '1,850,000 PLN',
    trend: {
      percentage: 15.8,
      direction: 'up',
      period: 'YoY'
    },
    breakdown: 'Projekty: 1.5M | Usługi: 350K',
    target: {
      value: '2,000,000 PLN',
      status: 'below'
    },
    icon: 'TrendingUp'
  },
  {
    id: '2',
    title: 'Wydatki',
    value: '1,420,000 PLN',
    trend: {
      percentage: 12.3,
      direction: 'up',
      period: 'YoY'
    },
    breakdown: 'Płace: 800K | Materiały: 420K | Inne: 200K',
    icon: 'TrendingDown'
  },
  {
    id: '3',
    title: 'Zysk netto',
    value: '430,000 PLN',
    trend: {
      percentage: 22.5,
      direction: 'up',
      period: 'YoY'
    },
    target: {
      value: '500,000 PLN',
      status: 'below'
    },
    icon: 'DollarSign'
  },
  {
    id: '4',
    title: 'Marża',
    value: '23.2%',
    trend: {
      percentage: 2.8,
      direction: 'up',
      period: 'YoY'
    },
    target: {
      value: '25%',
      status: 'below'
    },
    icon: 'Percent'
  }
];

// Mock KPIs
const mockKPIs: KPIMetric[] = [
  {
    id: '1',
    name: 'Wskaźnik płynności',
    value: 1.8,
    target: 1.5,
    unit: 'ratio',
    trend: {
      direction: 'up',
      percentage: 5.2,
      period: 'MoM'
    },
    status: 'good',
    category: 'cash_flow'
  },
  {
    id: '2',
    name: 'Średni czas inkasa',
    value: 45,
    target: 30,
    unit: 'dni',
    trend: {
      direction: 'down',
      percentage: -8.5,
      period: 'MoM'
    },
    status: 'warning',
    category: 'efficiency'
  },
  {
    id: '3',
    name: 'ROI projektów',
    value: 28.5,
    target: 25,
    unit: '%',
    trend: {
      direction: 'up',
      percentage: 3.2,
      period: 'QoQ'
    },
    status: 'good',
    category: 'profitability'
  }
];

// Mock Health Score
const mockHealthScore = {
  score: 78,
  rating: 'good' as const,
  factors: [
    { name: 'Rentowność', score: 85, weight: 0.3 },
    { name: 'Płynność', score: 75, weight: 0.25 },
    { name: 'Efektywność', score: 70, weight: 0.25 },
    { name: 'Wzrost', score: 82, weight: 0.2 }
  ]
};

// Mock Cash Flow Data
const generateMockCashFlowData = (): CashFlowData[] => {
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const baseInflow = 150000 + Math.random() * 50000;
    const baseOutflow = 120000 + Math.random() * 40000;
    
    return {
      period: month,
      date: new Date(new Date().getFullYear(), index, 1),
      inflows: {
        clientPayments: baseInflow * 0.85,
        otherIncome: baseInflow * 0.15,
        total: baseInflow
      },
      outflows: {
        payroll: baseOutflow * 0.45,
        materials: baseOutflow * 0.25,
        equipment: baseOutflow * 0.15,
        overhead: baseOutflow * 0.15,
        total: baseOutflow
      },
      netCashFlow: baseInflow - baseOutflow,
      cumulativeCashFlow: (baseInflow - baseOutflow) * (index + 1),
      projectedCashFlow: index > currentMonth - 3 ? baseInflow - baseOutflow + Math.random() * 10000 : undefined
    };
  });
};

// Mock Category Breakdown
const mockExpenseCategories: CategoryBreakdown[] = [
  {
    category: 'Wynagrodzenia',
    amount: 800000,
    percentage: 56.3,
    color: '#3B82F6',
    subcategories: [
      { category: 'Programiści', amount: 450000, percentage: 31.7, color: '#60A5FA' },
      { category: 'Kierownicy', amount: 200000, percentage: 14.1, color: '#93BBFC' },
      { category: 'Administracja', amount: 150000, percentage: 10.6, color: '#DBEAFE' }
    ]
  },
  {
    category: 'Materiały',
    amount: 420000,
    percentage: 29.6,
    color: '#10B981',
    subcategories: [
      { category: 'Cement i beton', amount: 180000, percentage: 12.7, color: '#34D399' },
      { category: 'Stal', amount: 120000, percentage: 8.5, color: '#6EE7B7' },
      { category: 'Drewno', amount: 80000, percentage: 5.6, color: '#A7F3D0' },
      { category: 'Inne', amount: 40000, percentage: 2.8, color: '#D1FAE5' }
    ]
  },
  {
    category: 'Sprzęt',
    amount: 120000,
    percentage: 8.5,
    color: '#F59E0B'
  },
  {
    category: 'Transport',
    amount: 80000,
    percentage: 5.6,
    color: '#EF4444'
  }
];

const mockRevenueCategories: CategoryBreakdown[] = [
  {
    category: 'Projekty budowlane',
    amount: 1500000,
    percentage: 81.1,
    color: '#8B5CF6',
    subcategories: [
      { category: 'Mieszkaniowe', amount: 800000, percentage: 43.2, color: '#A78BFA' },
      { category: 'Komercyjne', amount: 500000, percentage: 27.0, color: '#C4B5FD' },
      { category: 'Infrastruktura', amount: 200000, percentage: 10.8, color: '#EDE9FE' }
    ]
  },
  {
    category: 'Usługi konsultingowe',
    amount: 250000,
    percentage: 13.5,
    color: '#EC4899'
  },
  {
    category: 'Wynajem sprzętu',
    amount: 100000,
    percentage: 5.4,
    color: '#14B8A6'
  }
];

// Mock Projects Data
const mockProjectsData: ProjectFinancialSummary[] = [
  {
    id: '1',
    name: 'Osiedle Słoneczne - Etap II',
    status: 'Active',
    manager: {
      id: 'mgr1',
      name: 'Jan Kowalski',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan'
    },
    startDate: new Date('2024-01-15'),
    budget: {
      original: mockDecimal(850000),
      current: mockDecimal(820000),
      utilization: 72,
      variance: -3.5,
      status: 'healthy'
    },
    costs: {
      total: mockDecimal(590400),
      thisMonth: mockDecimal(85200),
      breakdown: {
        labor: mockDecimal(320000),
        materials: mockDecimal(180000),
        equipment: mockDecimal(60000),
        other: mockDecimal(30400)
      },
      trend: 'up'
    },
    revenue: {
      total: mockDecimal(680000),
      invoiced: mockDecimal(500000),
      pending: mockDecimal(180000),
      paymentStatus: 'current'
    },
    margin: {
      amount: mockDecimal(89600),
      percentage: 13.2,
      target: 15,
      rating: 3
    },
    paymentStatus: {
      status: 'Current',
      nextPaymentDue: new Date('2024-02-15')
    }
  },
  {
    id: '2',
    name: 'Centrum Logistyczne Nord',
    status: 'Active',
    manager: {
      id: 'mgr2',
      name: 'Anna Nowak',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna'
    },
    startDate: new Date('2023-11-01'),
    budget: {
      original: mockDecimal(1200000),
      current: mockDecimal(1350000),
      utilization: 85,
      variance: 12.5,
      status: 'warning'
    },
    costs: {
      total: mockDecimal(1147500),
      thisMonth: mockDecimal(125000),
      breakdown: {
        labor: mockDecimal(600000),
        materials: mockDecimal(400000),
        equipment: mockDecimal(100000),
        other: mockDecimal(47500)
      },
      trend: 'stable'
    },
    revenue: {
      total: mockDecimal(1400000),
      invoiced: mockDecimal(1100000),
      pending: mockDecimal(300000),
      paymentStatus: 'overdue'
    },
    margin: {
      amount: mockDecimal(252500),
      percentage: 18.0,
      target: 20,
      rating: 4
    },
    paymentStatus: {
      status: 'Overdue',
      daysOutstanding: 15,
      nextPaymentDue: new Date('2024-01-31')
    }
  },
  {
    id: '3',
    name: 'Modernizacja Szpitala Miejskiego',
    status: 'Completed',
    manager: {
      id: 'mgr3',
      name: 'Piotr Wiśniewski',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Piotr'
    },
    startDate: new Date('2023-06-01'),
    budget: {
      original: mockDecimal(2000000),
      current: mockDecimal(2000000),
      utilization: 100,
      variance: 0,
      status: 'healthy'
    },
    costs: {
      total: mockDecimal(1850000),
      thisMonth: mockDecimal(0),
      breakdown: {
        labor: mockDecimal(900000),
        materials: mockDecimal(700000),
        equipment: mockDecimal(150000),
        other: mockDecimal(100000)
      },
      trend: 'stable'
    },
    revenue: {
      total: mockDecimal(2200000),
      invoiced: mockDecimal(2200000),
      pending: mockDecimal(0),
      paymentStatus: 'current'
    },
    margin: {
      amount: mockDecimal(350000),
      percentage: 15.9,
      target: 15,
      rating: 5
    },
    paymentStatus: {
      status: 'Completed'
    }
  }
];

// Combined hook that mimics useFinancialDashboard
export function useMockFinancialDashboard(options: any = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const refetchAll = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return {
    overview: {
      data: mockFinancialOverview,
      metricsCards: mockMetricsCards,
      kpis: mockKPIs,
      healthScore: mockHealthScore,
      loading: false,
      error: null
    },
    cashFlow: {
      data: {
        historical: generateMockCashFlowData(),
        summary: {
          totalPeriods: 12,
          averageInflow: 175000,
          averageOutflow: 140000,
          averageNetFlow: 35000,
          currentPosition: 420000,
          projectedPosition: 580000
        }
      },
      loading: false,
      error: null
    },
    categories: {
      data: {
        expenses: mockExpenseCategories,
        revenue: mockRevenueCategories,
        summary: {
          totalExpenses: 1420000,
          totalRevenue: 1850000,
          expenseCategories: 4,
          revenueCategories: 3
        }
      },
      loading: false,
      error: null
    },
    projects: {
      data: {
        projects: mockProjectsData,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          pages: 1
        },
        summary: {
          totalProjects: 3,
          totalBudget: mockDecimal(4050000),
          totalCosts: mockDecimal(3587900),
          totalRevenue: mockDecimal(4280000),
          averageMargin: 15.7
        }
      },
      loading: false,
      error: null
    },
    loading,
    error: null,
    refetchAll
  };
}

export default useMockFinancialDashboard;