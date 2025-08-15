// Financial Calculations Utility Library
// Core financial calculation functions for company-wide financial analysis

import { Decimal } from '@prisma/client/runtime/library';
import type {
  FinancialOverview,
  ProjectFinancialSummary,
  CashFlowData,
  BudgetVarianceData,
  CategoryBreakdown,
  ProjectPerformanceData,
  KPIMetric
} from '@/types/finance';

// ========== Core Financial Calculations ==========

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(revenue: Decimal, expenses: Decimal): number {
  const revenueNum = Number(revenue);
  const expensesNum = Number(expenses);
  
  if (revenueNum === 0) return 0;
  
  const profit = revenueNum - expensesNum;
  return (profit / revenueNum) * 100;
}

/**
 * Calculate year-over-year growth percentage
 */
export function calculateYoYGrowth(current: Decimal, previous: Decimal): number {
  const currentNum = Number(current);
  const previousNum = Number(previous);
  
  if (previousNum === 0) return currentNum > 0 ? 100 : 0;
  
  return ((currentNum - previousNum) / previousNum) * 100;
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(spent: Decimal, budget: Decimal): number {
  const spentNum = Number(spent);
  const budgetNum = Number(budget);
  
  if (budgetNum === 0) return 0;
  
  return (spentNum / budgetNum) * 100;
}

/**
 * Calculate budget variance
 */
export function calculateBudgetVariance(actual: Decimal, budget: Decimal): {
  amount: number;
  percentage: number;
  status: 'under' | 'over' | 'on_track';
} {
  const actualNum = Number(actual);
  const budgetNum = Number(budget);
  
  const variance = actualNum - budgetNum;
  const variancePercentage = budgetNum === 0 ? 0 : (variance / budgetNum) * 100;
  
  let status: 'under' | 'over' | 'on_track';
  if (Math.abs(variancePercentage) <= 5) {
    status = 'on_track';
  } else if (variancePercentage < 0) {
    status = 'under';
  } else {
    status = 'over';
  }
  
  return {
    amount: variance,
    percentage: variancePercentage,
    status
  };
}

// ========== Project-Level Calculations ==========

/**
 * Calculate project profitability metrics
 */
export function calculateProjectProfitability(
  revenue: Decimal,
  costs: Decimal,
  budget: Decimal
): {
  profit: number;
  margin: number;
  budgetVariance: number;
  roi: number;
} {
  const revenueNum = Number(revenue);
  const costsNum = Number(costs);
  const budgetNum = Number(budget);
  
  const profit = revenueNum - costsNum;
  const margin = revenueNum === 0 ? 0 : (profit / revenueNum) * 100;
  const budgetVariance = budgetNum === 0 ? 0 : ((costsNum - budgetNum) / budgetNum) * 100;
  const roi = budgetNum === 0 ? 0 : (profit / budgetNum) * 100;
  
  return {
    profit,
    margin,
    budgetVariance,
    roi
  };
}

/**
 * Determine project financial health status
 */
export function getProjectFinancialStatus(
  budgetUtilization: number,
  margin: number,
  paymentStatus: string
): 'healthy' | 'warning' | 'critical' {
  // Critical conditions
  if (budgetUtilization > 110 || margin < -10 || paymentStatus === 'overdue') {
    return 'critical';
  }
  
  // Warning conditions
  if (budgetUtilization > 90 || margin < 5 || paymentStatus === 'partial') {
    return 'warning';
  }
  
  return 'healthy';
}

/**
 * Calculate project performance rating (1-5 stars)
 */
export function calculateProjectRating(
  margin: number,
  budgetVariance: number,
  timelinePerformance: number
): 1 | 2 | 3 | 4 | 5 {
  let score = 0;
  
  // Margin scoring (40% weight)
  if (margin >= 20) score += 2;
  else if (margin >= 15) score += 1.5;
  else if (margin >= 10) score += 1;
  else if (margin >= 5) score += 0.5;
  
  // Budget variance scoring (35% weight)
  const absVariance = Math.abs(budgetVariance);
  if (absVariance <= 5) score += 1.75;
  else if (absVariance <= 10) score += 1.25;
  else if (absVariance <= 15) score += 0.75;
  else if (absVariance <= 20) score += 0.25;
  
  // Timeline performance scoring (25% weight)
  if (timelinePerformance >= 95) score += 1.25;
  else if (timelinePerformance >= 85) score += 1;
  else if (timelinePerformance >= 75) score += 0.75;
  else if (timelinePerformance >= 65) score += 0.5;
  
  // Convert to 1-5 scale
  const rating = Math.max(1, Math.min(5, Math.ceil(score)));
  return rating as 1 | 2 | 3 | 4 | 5;
}

// ========== Cash Flow Calculations ==========

/**
 * Calculate net cash flow for a period
 */
export function calculateNetCashFlow(inflows: number, outflows: number): number {
  return inflows - outflows;
}

/**
 * Calculate cumulative cash flow
 */
export function calculateCumulativeCashFlow(
  periods: { inflows: number; outflows: number }[]
): number[] {
  let cumulative = 0;
  return periods.map(period => {
    cumulative += calculateNetCashFlow(period.inflows, period.outflows);
    return cumulative;
  });
}

/**
 * Predict future cash flow based on historical data
 */
export function predictCashFlow(
  historicalData: CashFlowData[],
  periodsAhead: number
): CashFlowData[] {
  if (historicalData.length < 3) return [];
  
  // Simple moving average prediction
  const recentPeriods = historicalData.slice(-6);
  const avgInflows = recentPeriods.reduce((sum, period) => sum + period.inflows.total, 0) / recentPeriods.length;
  const avgOutflows = recentPeriods.reduce((sum, period) => sum + period.outflows.total, 0) / recentPeriods.length;
  
  const predictions: CashFlowData[] = [];
  const lastPeriod = historicalData[historicalData.length - 1];
  let lastCumulative = lastPeriod.cumulativeCashFlow;
  
  for (let i = 1; i <= periodsAhead; i++) {
    const predictedDate = new Date(lastPeriod.date);
    predictedDate.setMonth(predictedDate.getMonth() + i);
    
    const netFlow = avgInflows - avgOutflows;
    lastCumulative += netFlow;
    
    predictions.push({
      period: `${predictedDate.getFullYear()}-${String(predictedDate.getMonth() + 1).padStart(2, '0')}`,
      date: predictedDate,
      inflows: {
        clientPayments: avgInflows * 0.8,
        otherIncome: avgInflows * 0.2,
        total: avgInflows
      },
      outflows: {
        payroll: avgOutflows * 0.45,
        materials: avgOutflows * 0.35,
        equipment: avgOutflows * 0.1,
        overhead: avgOutflows * 0.1,
        total: avgOutflows
      },
      netCashFlow: netFlow,
      cumulativeCashFlow: lastCumulative,
      projectedCashFlow: netFlow,
      confidenceInterval: {
        upper: netFlow * 1.2,
        lower: netFlow * 0.8
      }
    });
  }
  
  return predictions;
}

// ========== Category Analysis ==========

/**
 * Calculate category breakdown percentages
 */
export function calculateCategoryBreakdown(
  categories: { name: string; amount: number }[]
): CategoryBreakdown[] {
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
  
  if (total === 0) return [];
  
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];
  
  return categories
    .map((category, index) => ({
      category: category.name,
      amount: category.amount,
      percentage: (category.amount / total) * 100,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ========== KPI Calculations ==========

/**
 * Calculate key performance indicators
 */
export function calculateKPIs(
  projects: ProjectFinancialSummary[],
  cashFlowData: CashFlowData[],
  historicalData?: {
    previousRevenue: Decimal;
    previousProfit: Decimal;
  }
): KPIMetric[] {
  if (projects.length === 0) return [];
  
  const totalRevenue = projects.reduce((sum, p) => sum + Number(p.revenue.total), 0);
  const totalCosts = projects.reduce((sum, p) => sum + Number(p.costs.total), 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgMargin = projects.reduce((sum, p) => sum + p.margin.percentage, 0) / projects.length;
  
  const currentCashFlow = cashFlowData.length > 0 ? 
    cashFlowData[cashFlowData.length - 1].netCashFlow : 0;
  
  const kpis: KPIMetric[] = [
    {
      id: 'profit-margin',
      name: 'Profit Margin',
      value: totalRevenue === 0 ? 0 : (totalProfit / totalRevenue) * 100,
      target: 20,
      unit: '%',
      trend: {
        direction: historicalData ? 
          (totalProfit > Number(historicalData.previousProfit) ? 'up' : 'down') : 'stable',
        percentage: historicalData ? 
          calculateYoYGrowth(new Decimal(totalProfit), historicalData.previousProfit) : 0,
        period: 'vs last year'
      },
      status: avgMargin >= 20 ? 'good' : avgMargin >= 15 ? 'warning' : 'critical',
      category: 'profitability'
    },
    {
      id: 'revenue-growth',
      name: 'Revenue Growth',
      value: historicalData ? 
        calculateYoYGrowth(new Decimal(totalRevenue), historicalData.previousRevenue) : 0,
      target: 15,
      unit: '%',
      trend: {
        direction: historicalData ? 
          (totalRevenue > Number(historicalData.previousRevenue) ? 'up' : 'down') : 'stable',
        percentage: historicalData ? 
          calculateYoYGrowth(new Decimal(totalRevenue), historicalData.previousRevenue) : 0,
        period: 'vs last year'
      },
      status: 'good', // Will be calculated based on actual vs target
      category: 'growth'
    },
    {
      id: 'cash-flow',
      name: 'Monthly Cash Flow',
      value: currentCashFlow,
      target: 0,
      unit: '$',
      trend: {
        direction: currentCashFlow > 0 ? 'up' : 'down',
        percentage: 0, // Would need more historical data
        period: 'this month'
      },
      status: currentCashFlow > 50000 ? 'good' : currentCashFlow > 0 ? 'warning' : 'critical',
      category: 'cash_flow'
    },
    {
      id: 'project-efficiency',
      name: 'Project Efficiency',
      value: projects.filter(p => p.margin.percentage >= p.margin.target).length / projects.length * 100,
      target: 80,
      unit: '%',
      trend: {
        direction: 'stable',
        percentage: 0,
        period: 'this month'
      },
      status: 'good',
      category: 'efficiency'
    }
  ];
  
  return kpis;
}

// ========== Financial Health Scoring ==========

/**
 * Calculate overall financial health score (0-100)
 */
export function calculateFinancialHealthScore(
  overview: FinancialOverview,
  kpis: KPIMetric[],
  cashFlowData: CashFlowData[]
): {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  factors: { name: string; score: number; weight: number }[];
} {
  const factors: { name: string; score: number; weight: number }[] = [];
  
  // Profitability score (30% weight)
  const profitMargin = Number(overview.profitMargin);
  const profitabilityScore = Math.min(100, Math.max(0, (profitMargin / 25) * 100));
  factors.push({ name: 'Profitability', score: profitabilityScore, weight: 0.3 });
  
  // Cash flow score (25% weight)
  const avgCashFlow = cashFlowData.length > 0 ? 
    cashFlowData.reduce((sum, cf) => sum + cf.netCashFlow, 0) / cashFlowData.length : 0;
  const cashFlowScore = avgCashFlow > 0 ? 
    Math.min(100, (avgCashFlow / 100000) * 100) : 0;
  factors.push({ name: 'Cash Flow', score: cashFlowScore, weight: 0.25 });
  
  // Growth score (20% weight)
  const revenueGrowth = overview.yearOverYearGrowth.revenue;
  const growthScore = Math.min(100, Math.max(0, ((revenueGrowth + 10) / 30) * 100));
  factors.push({ name: 'Growth', score: growthScore, weight: 0.2 });
  
  // Efficiency score (15% weight)
  const efficiencyKPI = kpis.find(k => k.id === 'project-efficiency');
  const efficiencyScore = efficiencyKPI ? efficiencyKPI.value : 50;
  factors.push({ name: 'Efficiency', score: efficiencyScore, weight: 0.15 });
  
  // Financial stability score (10% weight)
  const stabilityScore = Math.max(0, 100 - Math.abs(overview.yearOverYearGrowth.expenses));
  factors.push({ name: 'Stability', score: stabilityScore, weight: 0.1 });
  
  // Calculate weighted average
  const totalScore = factors.reduce((sum, factor) => 
    sum + (factor.score * factor.weight), 0);
  
  let rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (totalScore >= 90) rating = 'excellent';
  else if (totalScore >= 75) rating = 'good';
  else if (totalScore >= 60) rating = 'fair';
  else if (totalScore >= 40) rating = 'poor';
  else rating = 'critical';
  
  return {
    score: Math.round(totalScore),
    rating,
    factors
  };
}

// ========== Utility Functions ==========

/**
 * Format currency values for display
 */
export function formatCurrency(
  amount: number | Decimal,
  currency: 'USD' | 'EUR' | 'PLN' = 'USD',
  locale: string = 'en-US'
): string {
  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  
  const currencyMap = {
    USD: '$',
    EUR: '€',
    PLN: 'zł'
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
}

/**
 * Format percentage values for display
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  const abs = Math.abs(num);
  
  if (abs >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  } else if (abs >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  } else if (abs >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  
  return num.toString();
}

/**
 * Calculate trend direction and color
 */
export function getTrendDirection(
  current: number,
  previous: number
): {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  color: string;
  icon: string;
} {
  const change = current - previous;
  const percentage = previous === 0 ? 0 : (change / previous) * 100;
  
  if (Math.abs(percentage) < 0.1) {
    return {
      direction: 'neutral',
      percentage: 0,
      color: 'text-gray-500',
      icon: 'minus'
    };
  }
  
  if (change > 0) {
    return {
      direction: 'up',
      percentage,
      color: 'text-green-600',
      icon: 'trending-up'
    };
  }
  
  return {
    direction: 'down',
    percentage: Math.abs(percentage),
    color: 'text-red-600',
    icon: 'trending-down'
  };
}

export { formatCurrency as default };