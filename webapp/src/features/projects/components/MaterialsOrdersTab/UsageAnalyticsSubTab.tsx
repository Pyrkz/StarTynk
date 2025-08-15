'use client';

import { useState } from 'react';
import { 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface UsageAnalyticsSubTabProps {
  projectId: string;
}

interface CategoryUsage {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface MaterialEfficiency {
  materialName: string;
  plannedUsage: number;
  actualUsage: number;
  efficiency: number;
  status: 'excellent' | 'good' | 'warning' | 'poor';
}

interface SupplierPerformance {
  supplier: string;
  onTimeDelivery: number;
  qualityScore: number;
  orderAccuracy: number;
  overallScore: number;
}

const UsageAnalyticsSubTab = ({ projectId }: UsageAnalyticsSubTabProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - replace with API calls
  const monthlyConsumption = [
    { month: 'Sty', value: 42000 },
    { month: 'Lut', value: 48000 },
    { month: 'Mar', value: 55000 },
    { month: 'Kwi', value: 58000 },
  ];

  const categoryBreakdown: CategoryUsage[] = [
    { category: 'Tynki gipsowe', value: 28000, percentage: 48, color: 'bg-blue-500' },
    { category: 'Tynki cementowo-wapienne', value: 18000, percentage: 31, color: 'bg-green-500' },
    { category: 'Tynki dekoracyjne', value: 8000, percentage: 14, color: 'bg-purple-500' },
    { category: 'Materiały pomocnicze', value: 4000, percentage: 7, color: 'bg-yellow-500' },
  ];

  const materialEfficiency: MaterialEfficiency[] = [
    { materialName: 'Gips szpachlowy Knauf MP75', plannedUsage: 180, actualUsage: 165, efficiency: 91, status: 'excellent' },
    { materialName: 'Cement portlandzki CEM I 42,5R', plannedUsage: 120, actualUsage: 115, efficiency: 96, status: 'excellent' },
    { materialName: 'Wapno hydratyzowane', plannedUsage: 80, actualUsage: 95, efficiency: 84, status: 'good' },
    { materialName: 'Tynk dekoracyjny strukturalny', plannedUsage: 50, actualUsage: 62, efficiency: 81, status: 'good' },
    { materialName: 'Siatka zbrojąca do tynków', plannedUsage: 200, actualUsage: 255, efficiency: 78, status: 'warning' },
    { materialName: 'Narożniki aluminiowe', plannedUsage: 150, actualUsage: 210, efficiency: 71, status: 'warning' },
    { materialName: 'Grunt głęboko penetrujący', plannedUsage: 30, actualUsage: 45, efficiency: 67, status: 'poor' },
  ];

  const supplierPerformance: SupplierPerformance[] = [
    { supplier: 'Knauf Polska', onTimeDelivery: 96, qualityScore: 98, orderAccuracy: 97, overallScore: 97 },
    { supplier: 'Cemex Polska', onTimeDelivery: 92, qualityScore: 95, orderAccuracy: 94, overallScore: 94 },
    { supplier: 'Atlas Polska', onTimeDelivery: 88, qualityScore: 90, orderAccuracy: 89, overallScore: 89 },
    { supplier: 'Mapei Polska', onTimeDelivery: 85, qualityScore: 88, orderAccuracy: 87, overallScore: 87 },
    { supplier: 'Lhoist Polska', onTimeDelivery: 90, qualityScore: 92, orderAccuracy: 91, overallScore: 91 },
    { supplier: 'Ceresit Henkel', onTimeDelivery: 82, qualityScore: 85, orderAccuracy: 83, overallScore: 83 },
  ];

  const reorderPredictions = [
    { material: 'Wapno hydratyzowane', currentStock: 8, dailyUsage: 2.2, daysLeft: 3, reorderDate: '23.04.2024' },
    { material: 'Gips szpachlowy Knauf MP75', currentStock: 45, dailyUsage: 3.6, daysLeft: 12, reorderDate: '02.05.2024' },
    { material: 'Narożniki aluminiowe', currentStock: 25, dailyUsage: 4.3, daysLeft: 6, reorderDate: '26.04.2024' },
    { material: 'Grunt głęboko penetrujący', currentStock: 0, dailyUsage: 1.7, daysLeft: 0, reorderDate: 'PILNE' },
  ];

  const getEfficiencyBadge = (status: MaterialEfficiency['status']) => {
    switch (status) {
      case 'excellent':
        return <Badge variant="success">Doskonała</Badge>;
      case 'good':
        return <Badge variant="primary">Dobra</Badge>;
      case 'warning':
        return <Badge variant="warning">Wymaga uwagi</Badge>;
      case 'poor':
        return <Badge variant="error">Słaba</Badge>;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-blue-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Analiza zużycia materiałów</h3>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {range === 'week' && 'Tydzień'}
              {range === 'month' && 'Miesiąc'}
              {range === 'quarter' && 'Kwartał'}
              {range === 'year' && 'Rok'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Całkowite zużycie</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">58 000 zł</p>
          <p className="text-sm text-green-600 mt-1">+12% vs poprzedni miesiąc</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Efektywność</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">87%</p>
          <p className="text-sm text-blue-600 mt-1">Rzeczywiste vs planowane</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Odpady</span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">6.2%</p>
          <p className="text-sm text-orange-600 mt-1">Wymaga redukcji</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Oszczędności</span>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">4 200 zł</p>
          <p className="text-sm text-green-600 mt-1">Dzięki optymalizacji</p>
        </div>
      </div>

      {/* Monthly Consumption Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Miesięczne zużycie materiałów</h4>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksportuj
          </Button>
        </div>
        <div className="relative h-64">
          {/* Simple bar chart visualization */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full">
            {monthlyConsumption.map((month, index) => {
              const height = (month.value / 60000) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end px-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {(month.value / 1000).toFixed(0)}k
                  </div>
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-sm text-gray-600 mt-2">{month.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Podział według kategorii</h4>
          <div className="space-y-3">
            {categoryBreakdown.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(category.value / 1000).toFixed(0)}k zł ({category.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all", category.color)}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Wydajność dostawców</h4>
          <div className="space-y-3">
            {supplierPerformance.map((supplier, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{supplier.supplier}</span>
                  <Badge variant={supplier.overallScore >= 90 ? 'success' : 'warning'}>
                    {supplier.overallScore}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Terminowość:</span>
                    <span className="font-medium ml-1">{supplier.onTimeDelivery}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Jakość:</span>
                    <span className="font-medium ml-1">{supplier.qualityScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dokładność:</span>
                    <span className="font-medium ml-1">{supplier.orderAccuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material Efficiency Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Efektywność wykorzystania materiałów</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Materiał</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Plan</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Rzeczywiste</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Efektywność</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {materialEfficiency.map((material, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{material.materialName}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{material.plannedUsage}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{material.actualUsage}</td>
                  <td className={cn("py-3 px-4 text-sm text-right font-medium", getEfficiencyColor(material.efficiency))}>
                    {material.efficiency}%
                  </td>
                  <td className="py-3 px-4 text-right">{getEfficiencyBadge(material.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Predictions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h4 className="font-semibold text-amber-900">Przewidywane zamówienia</h4>
        </div>
        <div className="space-y-2">
          {reorderPredictions.map((prediction, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{prediction.material}</p>
                <p className="text-sm text-gray-600">
                  Obecny stan: {prediction.currentStock} • Tempo: {prediction.dailyUsage}/dzień
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-amber-700">
                  Zamów przed: {prediction.reorderDate}
                </p>
                <p className="text-xs text-gray-600">Za {prediction.daysLeft} dni</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalyticsSubTab;