"use client";

import { useState, useEffect } from "react";
import type { EmployeeWithRelations, EmployeeFilters } from "../types/employee.types";

export function useEmployees(filters?: EmployeeFilters) {
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status);
        if (filters?.department) params.append("department", filters.department);
        if (filters?.projectId) params.append("projectId", filters.projectId);
        if (filters?.searchQuery) params.append("search", filters.searchQuery);
        
        const response = await fetch(`/api/employees?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }
        
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [filters?.status, filters?.department, filters?.projectId, filters?.searchQuery]);

  return { employees, isLoading, error };
}