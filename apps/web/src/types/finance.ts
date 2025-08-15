// Global Finance Dashboard Types
// Comprehensive financial data types for company-wide financial management

import { Decimal } from '@repo/database';

// ========== Core Financial Metrics ==========

export interface FinancialOverview {
  totalRevenue: Decimal;
  totalExpenses: Decimal;
  netProfit: Decimal;
  profitMargin: number;
  activeProjectsValue: Decimal;
  activeProjectsCount: number;
  pipelineValue: Decimal;
  yearOverYearGrowth: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

export interface FinancialMetricsCard {
  id: string;
  title: string;
  value: string;
  trend: {
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  breakdown?: string;
  target?: {
    value: string;
    status: 'meeting' | 'exceeding' | 'below';
  };
  icon: string;
}

// ========== Revenue & Expense Analytics ==========

export interface RevenueExpenseChartData {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  budgetTarget: number;
  date: Date;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  subcategories?: CategoryBreakdown[];
}

export interface ProjectPerformanceData {
  projectId: string;
  name: string;
  budget: number;
  actualCosts: number;
  revenue: number;
  profit: number;
  margin: number;
  status: 'under_budget' | 'over_budget' | 'on_track';
  completionPercentage: number;
}

// ========== Project Financial Data ==========

export interface ProjectFinancialSummary {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Planning';
  manager: {
    id: string;
    name: string;
    avatar?: string;
  };
  startDate: Date;
  budget: {
    original: Decimal;
    current: Decimal;
    utilization: number;
    variance: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  costs: {
    total: Decimal;
    thisMonth: Decimal;
    breakdown: {
      labor: Decimal;
      materials: Decimal;
      equipment: Decimal;
      other: Decimal;
    };
    trend: 'up' | 'down' | 'stable';
  };
  revenue: {
    total: Decimal;
    invoiced: Decimal;
    pending: Decimal;
    paymentStatus: 'current' | 'overdue' | 'partial';
  };
  margin: {
    amount: Decimal;
    percentage: number;
    target: number;
    rating: 1 | 2 | 3 | 4 | 5;
  };
  paymentStatus: {
    status: 'Current' | 'Overdue' | 'Partial' | 'Completed';
    daysOutstanding?: number;
    nextPaymentDue?: Date;
  };
}

// ========== Cash Flow Management ==========

export interface CashFlowData {
  period: string;
  date: Date;
  inflows: {
    clientPayments: number;
    otherIncome: number;
    total: number;
  };
  outflows: {
    payroll: number;
    materials: number;
    equipment: number;
    overhead: number;
    total: number;
  };
  netCashFlow: number;
  cumulativeCashFlow: number;
  projectedCashFlow?: number;
  confidenceInterval?: {
    upper: number;
    lower: number;
  };
}

export interface CashFlowPosition {
  availableCash: Decimal;
  projectedInflows: {
    next30Days: Decimal;
    next60Days: Decimal;
    next90Days: Decimal;
  };
  projectedOutflows: {
    next30Days: Decimal;
    next60Days: Decimal;
    next90Days: Decimal;
  };
  netCashFlow: {
    next30Days: Decimal;
    next60Days: Decimal;
    next90Days: Decimal;
  };
}

// ========== Payment & Invoice Tracking ==========

export interface PaymentTrackingData {
  overdueInvoices: {
    count: number;
    totalAmount: Decimal;
    avgDaysOverdue: number;
    items: InvoiceItem[];
  };
  upcomingPayments: {
    count: number;
    totalAmount: Decimal;
    dueWithin7Days: Decimal;
    items: PaymentItem[];
  };
  paymentTermsAnalysis: {
    averageCollectionDays: number;
    onTimePaymentRate: number;
    customerPaymentRatings: CustomerPaymentRating[];
  };
}

export interface InvoiceItem {
  id: string;
  projectName: string;
  clientName: string;
  amount: Decimal;
  issueDate: Date;
  dueDate: Date;
  daysOverdue: number;
  status: 'overdue' | 'pending' | 'paid';
}

export interface PaymentItem {
  id: string;
  description: string;
  vendor: string;
  amount: Decimal;
  dueDate: Date;
  category: 'payroll' | 'materials' | 'equipment' | 'overhead';
  priority: 'high' | 'medium' | 'low';
}

export interface CustomerPaymentRating {
  developerId: string;
  developerName: string;
  averageDays: number;
  onTimeRate: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

// ========== Budget Analysis ==========

export interface BudgetVarianceData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'under' | 'over' | 'on_track';
  trend: 'improving' | 'worsening' | 'stable';
}

export interface BudgetAlert {
  id: string;
  type: 'budget_overrun' | 'cash_flow_warning' | 'payment_delay' | 'performance_issue';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  projectId?: string;
  amount?: Decimal;
  dueDate?: Date;
  actionRequired: boolean;
}

// ========== Financial Reports ==========

export interface FinancialReport {
  id: string;
  type: 'profit_loss' | 'cash_flow' | 'budget_variance' | 'project_profitability';
  title: string;
  period: {
    start: Date;
    end: Date;
    type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  data: unknown; // Will be typed based on report type
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  projects?: string[];
  categories?: string[];
  includeInactive?: boolean;
}

// ========== Performance Analytics ==========

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  status: 'good' | 'warning' | 'critical';
  category: 'profitability' | 'efficiency' | 'growth' | 'cash_flow';
}

export interface BusinessIntelligenceData {
  marketTrendImpact: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: number;
    description: string;
  }[];
  predictiveAnalytics: {
    revenueForecasting: {
      next3Months: number;
      next6Months: number;
      next12Months: number;
      confidence: number;
    };
    riskAssessment: {
      projectRisks: ProjectRiskAssessment[];
      financialRisks: FinancialRisk[];
    };
  };
}

export interface ProjectRiskAssessment {
  projectId: string;
  projectName: string;
  riskScore: number;
  riskFactors: string[];
  successProbability: number;
  recommendedActions: string[];
}

export interface FinancialRisk {
  type: 'cash_flow' | 'credit' | 'market' | 'operational';
  description: string;
  probability: number;
  impact: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
}

// ========== API Response Types ==========

export interface FinancialDashboardResponse {
  overview: FinancialOverview;
  metricsCards: FinancialMetricsCard[];
  revenueExpenseData: RevenueExpenseChartData[];
  categoryBreakdowns: {
    revenue: CategoryBreakdown[];
    expenses: CategoryBreakdown[];
  };
  projectPerformance: ProjectPerformanceData[];
  cashFlowData: CashFlowData[];
  budgetVariance: BudgetVarianceData[];
  alerts: BudgetAlert[];
  kpis: KPIMetric[];
}

export interface ProjectFinancialTableResponse {
  projects: ProjectFinancialSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalProjects: number;
    totalBudget: Decimal;
    totalCosts: Decimal;
    totalRevenue: Decimal;
    averageMargin: number;
  };
}

// ========== Filter & Search Types ==========

export interface FinancialFilters {
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear';
  };
  projects: {
    ids: string[];
    statuses: string[];
    categories: string[];
  };
  includeInactive: boolean;
  costCategories: string[];
  minAmount?: number;
  maxAmount?: number;
}

export interface FinancialSearchParams {
  query?: string;
  filters: FinancialFilters;
  sortBy: 'name' | 'budget' | 'costs' | 'revenue' | 'margin' | 'status';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ========== Chart Configuration Types ==========

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'mixed';
  responsive: boolean;
  animation: boolean;
  colors: string[];
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  tooltip: {
    format: 'currency' | 'percentage' | 'number';
    precision: number;
  };
}

export interface DashboardLayout {
  sections: {
    id: string;
    title: string;
    order: number;
    visible: boolean;
    size: 'full' | 'half' | 'third' | 'quarter';
  }[];
  preferences: {
    theme: 'light' | 'dark';
    currency: 'USD' | 'EUR' | 'PLN';
    dateFormat: string;
    refreshInterval: number;
  };
}

export type FinancialPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type FinancialCategory = 'labor' | 'materials' | 'equipment' | 'overhead' | 'delivery' | 'other';
export type CurrencyCode = 'USD' | 'EUR' | 'PLN';
export type ComparisonPeriod = 'previous_period' | 'same_period_last_year' | 'budget' | 'target';