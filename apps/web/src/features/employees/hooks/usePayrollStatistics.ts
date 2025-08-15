"use client";

import { useState, useEffect } from "react";
import type { PayrollStatistics } from "../types/employee.types";

// Mock payroll statistics - dane przykładowe
const mockStatistics: PayrollStatistics = {
  monthlyPayrollTotal: 52850,
  totalEmployees: 8,
  outstandingPayments: 28260,
  pendingPaymentsCount: 4,
  overduePaymentsCount: 0,
  averageHourlyRate: 42.5,
  hourlyRateRange: {
    min: 28,
    max: 65
  },
  qualityBonusPool: 6560,
  eligibleEmployeesPercentage: 85
};

export function usePayrollStatistics() {
  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setStatistics(mockStatistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania statystyk płac");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, isLoading, error };
}