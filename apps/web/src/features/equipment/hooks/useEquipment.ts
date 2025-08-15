'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  EquipmentWithRelations,
  EquipmentFilters,
  EquipmentSortOptions,
  EquipmentStats,
  EquipmentListResponse,
  CreateEquipmentData,
  UpdateEquipmentData,
  EquipmentAssignmentData,
  BulkOperationData,
  EquipmentViewMode
} from '../types/equipment.types';

export function useEquipment() {
  const [equipment, setEquipment] = useState<EquipmentWithRelations[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [sortOptions, setSortOptions] = useState<EquipmentSortOptions>({
    field: 'name',
    direction: 'asc'
  });
  const [viewMode, setViewMode] = useState<EquipmentViewMode>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sortOptions.field,
        sortDirection: sortOptions.direction,
        ...(filters.search && { search: filters.search }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.status && { status: filters.status.join(',') }),
        ...(filters.condition && { condition: filters.condition.join(',') }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters.location && { location: filters.location }),
      });

      const response = await fetch(`/api/equipment?${params}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');

      const data: EquipmentListResponse = await response.json();
      
      setEquipment(data.equipment);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, sortOptions, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const updateFilters = useCallback((newFilters: Partial<EquipmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const updateSortOptions = useCallback((newSort: EquipmentSortOptions) => {
    setSortOptions(newSort);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  return {
    // Data
    equipment,
    stats,
    
    // UI State
    loading,
    error,
    viewMode,
    
    // Filters & Sorting
    filters,
    sortOptions,
    pagination,
    
    // Actions
    updateFilters,
    updateSortOptions,
    changePage,
    changePageSize,
    toggleViewMode,
    refetch: fetchEquipment,
  };
}

export function useEquipmentOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEquipment = useCallback(async (data: CreateEquipmentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create equipment');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEquipment = useCallback(async (id: string, data: UpdateEquipmentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update equipment');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete equipment');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignEquipment = useCallback(async (data: EquipmentAssignmentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/equipment/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign equipment');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const returnEquipment = useCallback(async (assignmentId: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/equipment/return/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to return equipment');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkOperation = useCallback(async (data: BulkOperationData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/equipment/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to perform bulk operation');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    assignEquipment,
    returnEquipment,
    bulkOperation,
  };
}

export function useEquipmentCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/equipment/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const data = await response.json();
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}