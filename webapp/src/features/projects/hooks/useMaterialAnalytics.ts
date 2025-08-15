import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface MonthlyConsumption {
  month: string;
  value: number;
}

interface CategoryUsage {
  category: string;
  value: number;
  percentage: number;
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

interface ReorderPrediction {
  material: string;
  currentStock: number;
  dailyUsage: number;
  daysLeft: number;
  reorderDate: string;
}

interface MaterialAnalytics {
  monthlyConsumption: MonthlyConsumption[];
  categoryBreakdown: CategoryUsage[];
  materialEfficiency: MaterialEfficiency[];
  supplierPerformance: SupplierPerformance[];
  reorderPredictions: ReorderPrediction[];
  metrics: {
    totalConsumption: number;
    efficiencyRate: number;
    wastePercentage: number;
    savings: number;
    trend: {
      value: number;
      isPositive: boolean;
    };
  };
}

export const useMaterialAnalytics = (projectId: string, timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const [analytics, setAnalytics] = useState<MaterialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/material-analytics?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch material analytics');
        }

        const data: MaterialAnalytics = await response.json();
        setAnalytics(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId, timeRange, toast]);

  const exportData = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/material-analytics/export?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material-analytics-${projectId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const refetch = async () => {
    // Refetch logic
  };

  return {
    analytics,
    loading,
    error,
    exportData,
    refetch,
  };
};