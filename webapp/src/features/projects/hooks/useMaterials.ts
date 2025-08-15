import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface Material {
  id: string;
  name: string;
  category: string;
  supplier: string;
  imageUrl?: string;
  currentStock: number;
  allocatedQuantity: number;
  unit: string;
  lastDeliveryDate: string;
  usedThisMonth: number;
  remaining: number;
  burnRate: number;
  stockStatus: 'inStock' | 'lowStock' | 'outOfStock' | 'onOrder';
}

interface MaterialsResponse {
  materials: Material[];
  totalCount: number;
  categories: string[];
}

export const useMaterials = (projectId: string) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/materials`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }

        const data: MaterialsResponse = await response.json();
        setMaterials(data.materials);
        setCategories(data.categories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load materials',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchMaterials();
    }
  }, [projectId, toast]);

  const refetch = async () => {
    // Refetch logic
  };

  return {
    materials,
    categories,
    loading,
    error,
    refetch,
  };
};