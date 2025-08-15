// Financial Charts Section Component
// Interactive charts for revenue/expense analytics with multiple chart types

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Calendar,
  BarChart3Icon,
  LineChartIcon,
  PieChartIcon,
  SettingsIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  FinancialOverview,
  CashFlowData,
  CategoryBreakdown,
  KPIMetric
} from '@/types/finance';

interface FinancialChartsSectionProps {
  overviewData: FinancialOverview | null;
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
  kpis: KPIMetric[];
  loading: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  orange: '#F97316',
  pink: '#EC4899',
  gray: '#6B7280'
};

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Miesięcznie' },
  { value: 'quarterly', label: 'Kwartalnie' },
  { value: 'yearly', label: 'Rocznie' }
];

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Liniowy', icon: LineChartIcon },
  { value: 'area', label: 'Obszarowy', icon: BarChart3Icon },
  { value: 'bar', label: 'Słupkowy', icon: BarChart3Icon }
];

export function FinancialChartsSection({
  overviewData,
  cashFlowData,
  categoryData,
  kpis,
  loading,
  dateRange
}: FinancialChartsSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [primaryChartType, setPrimaryChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [showPredictions, setShowPredictions] = useState(true);

  // Prepare data for main revenue/expense trend chart
  const prepareMainChartData = () => {
    if (!cashFlowData?.historical) return [];

    const data = cashFlowData.historical.map(period => ({
      period: new Intl.DateTimeFormat('pl-PL', { 
        month: 'short', year: '2-digit' 
      }).format(new Date(period.date)),
      fullDate: period.date,
      revenue: period.inflows.total,
      expenses: period.outflows.total,
      profit: period.netCashFlow,
      cumulativeProfit: period.cumulativeCashFlow
    }));

    // Add predictions if available
    if (showPredictions && cashFlowData.predictions) {
      const predictions = cashFlowData.predictions.map(period => ({
        period: new Intl.DateTimeFormat('pl-PL', { 
          month: 'short', year: '2-digit' 
        }).format(new Date(period.date)),
        fullDate: period.date,
        revenue: period.inflows.total,
        expenses: period.outflows.total,
        profit: period.netCashFlow,
        cumulativeProfit: period.cumulativeCashFlow,
        isPrediction: true
      }));
      
      return [...data, ...predictions];
    }

    return data;
  };

  // Prepare data for project performance scatter plot
  const prepareProjectPerformanceData = () => {
    // Mock data - in real app would come from projectsData
    return [
      { budget: 500000, actualCosts: 450000, profit: 50000, name: 'Project A', status: 'under_budget' },
      { budget: 750000, actualCosts: 800000, profit: -50000, name: 'Project B', status: 'over_budget' },
      { budget: 300000, actualCosts: 290000, profit: 10000, name: 'Project C', status: 'on_track' },
      { budget: 1000000, actualCosts: 950000, profit: 50000, name: 'Project D', status: 'under_budget' },
      { budget: 600000, actualCosts: 620000, profit: -20000, name: 'Project E', status: 'over_budget' }
    ];
  };

  const mainChartData = prepareMainChartData();
  const projectPerformanceData = prepareProjectPerformanceData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-80 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
            {CHART_TYPE_OPTIONS.map(option => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setPrimaryChartType(option.value as any)}
                  className={`p-1 rounded text-xs ${
                    primaryChartType === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={option.label}
                >
                  <IconComponent className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={(e) => setShowPredictions(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Pokaż prognozy
          </label>
          
          <Button variant="outline" size="sm">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Ustawienia
          </Button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Revenue/Expense Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trendy Przychodów i Kosztów</CardTitle>
            <CardDescription>
              Porównanie przychodów, kosztów i zysku w czasie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {primaryChartType === 'line' ? (
                <LineChart data={mainChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="period" 
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    fontSize={12}
                    stroke="#6b7280"
                    tickFormatter={formatLargeNumber}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={3}
                    name="Przychody"
                    strokeDasharray={(data: any) => data.isPrediction ? "5 5" : "0"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke={CHART_COLORS.danger}
                    strokeWidth={3}
                    name="Koszty"
                    strokeDasharray={(data: any) => data.isPrediction ? "5 5" : "0"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    name="Zysk"
                    strokeDasharray={(data: any) => data.isPrediction ? "5 5" : "0"}
                  />
                </LineChart>
              ) : primaryChartType === 'area' ? (
                <AreaChart data={mainChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" fontSize={12} stroke="#6b7280" />
                  <YAxis fontSize={12} stroke="#6b7280" tickFormatter={formatLargeNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1"
                    stroke={CHART_COLORS.secondary}
                    fill={CHART_COLORS.secondary}
                    fillOpacity={0.6}
                    name="Przychody"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke={CHART_COLORS.danger}
                    fill={CHART_COLORS.danger}
                    fillOpacity={0.6}
                    name="Koszty"
                  />
                </AreaChart>
              ) : (
                <BarChart data={mainChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" fontSize={12} stroke="#6b7280" />
                  <YAxis fontSize={12} stroke="#6b7280" tickFormatter={formatLargeNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" fill={CHART_COLORS.secondary} name="Przychody" />
                  <Bar dataKey="expenses" fill={CHART_COLORS.danger} name="Koszty" />
                  <Bar dataKey="profit" fill={CHART_COLORS.primary} name="Zysk" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Podział Przychodów</CardTitle>
            <CardDescription>
              Struktura przychodów według kategorii projektów
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData?.revenue || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {(categoryData?.revenue || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Kwota']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Struktura Kosztów</CardTitle>
            <CardDescription>
              Rozkład kosztów według kategorii
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryData?.expenses || []}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  fontSize={12} 
                  stroke="#6b7280"
                  tickFormatter={formatLargeNumber}
                />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  fontSize={12} 
                  stroke="#6b7280"
                  width={75}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Kwota']}
                />
                <Bar 
                  dataKey="amount" 
                  fill={CHART_COLORS.tertiary}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Performance Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle>Wydajność Projektów</CardTitle>
            <CardDescription>
              Budżet vs rzeczywiste koszty projektów
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={projectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="budget" 
                  name="Budżet"
                  fontSize={12}
                  stroke="#6b7280"
                  tickFormatter={formatLargeNumber}
                />
                <YAxis 
                  type="number" 
                  dataKey="actualCosts" 
                  name="Rzeczywiste koszty"
                  fontSize={12}
                  stroke="#6b7280"
                  tickFormatter={formatLargeNumber}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            Budżet: {formatCurrency(data.budget)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Koszty: {formatCurrency(data.actualCosts)}
                          </p>
                          <p className={`text-sm font-medium ${
                            data.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Zysk: {formatCurrency(data.profit)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Projekty" 
                  dataKey="actualCosts"
                  fill={(data: any) => 
                    data.status === 'under_budget' ? CHART_COLORS.secondary :
                    data.status === 'over_budget' ? CHART_COLORS.danger :
                    CHART_COLORS.tertiary
                  }
                />
              </ScatterChart>
            </ResponsiveContainer>
            
            {/* Legend for scatter plot */}
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }}></div>
                <span>Poniżej budżetu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.tertiary }}></div>
                <span>W budżecie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.danger }}></div>
                <span>Ponad budżet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      {cashFlowData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie Statystyk Finansowych</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {cashFlowData.summary.totalPeriods}
                </p>
                <p className="text-sm text-gray-600">Okresów</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatLargeNumber(cashFlowData.summary.averageInflow)}
                </p>
                <p className="text-sm text-gray-600">Średnie wpływy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatLargeNumber(cashFlowData.summary.averageOutflow)}
                </p>
                <p className="text-sm text-gray-600">Średnie wydatki</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  cashFlowData.summary.averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatLargeNumber(cashFlowData.summary.averageNetFlow)}
                </p>
                <p className="text-sm text-gray-600">Średni cash flow</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  cashFlowData.summary.currentPosition >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatLargeNumber(cashFlowData.summary.currentPosition)}
                </p>
                <p className="text-sm text-gray-600">Aktualna pozycja</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FinancialChartsSection;