"use client";

import { useState, useEffect } from "react";
import type { EmployeePayrollData, PayrollFilters } from "../types/employee.types";

// Mock payroll data - dane przykładowe
const mockPayrollData: EmployeePayrollData[] = [
  {
    userId: "1",
    employeeId: "EMP-001",
    name: "Jan Kowalski",
    position: "Kierownik budowy",
    image: null,
    baseEarnings: 8500,
    qualityBonus: 1200,
    totalEarnings: 9700,
    totalHours: 168,
    tasksCompleted: 12,
    qualityScore: 96,
    paymentStatus: "PAID",
    paymentDate: "2024-01-25",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "2",
    employeeId: "EMP-002", 
    name: "Anna Nowak",
    position: "Murarz",
    image: null,
    baseEarnings: 7200,
    qualityBonus: 800,
    totalEarnings: 8000,
    totalHours: 160,
    tasksCompleted: 15,
    qualityScore: 92,
    paymentStatus: "PENDING",
    paymentDate: "2024-02-01",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "3",
    employeeId: "EMP-003",
    name: "Piotr Wiśniewski",
    position: "Elektryk",
    image: null,
    baseEarnings: 6800,
    qualityBonus: 950,
    totalEarnings: 7750,
    totalHours: 165,
    tasksCompleted: 11,
    qualityScore: 94,
    paymentStatus: "PAID",
    paymentDate: "2024-01-25",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "4",
    employeeId: "EMP-004",
    name: "Maria Kaczmarek",
    position: "Hydraulik",
    image: null,
    baseEarnings: 6500,
    qualityBonus: 650,
    totalEarnings: 7150,
    totalHours: 158,
    tasksCompleted: 9,
    qualityScore: 89,
    paymentStatus: "PENDING",
    paymentDate: "2024-02-01",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "5",
    employeeId: "EMP-005",
    name: "Tomasz Lewandowski",
    position: "Tynkarz",
    image: null,
    baseEarnings: 5800,
    qualityBonus: 580,
    totalEarnings: 6380,
    totalHours: 152,
    tasksCompleted: 13,
    qualityScore: 91,
    paymentStatus: "PAID",
    paymentDate: "2024-01-25",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "6",
    employeeId: "EMP-006",
    name: "Karolina Szymańska",
    position: "Malarz",
    image: null,
    baseEarnings: 5200,
    qualityBonus: 780,
    totalEarnings: 5980,
    totalHours: 145,
    tasksCompleted: 16,
    qualityScore: 95,
    paymentStatus: "PENDING",
    paymentDate: "2024-02-01",
    paymentMethod: "Przelew bankowy"
  },
  {
    userId: "7",
    employeeId: "EMP-007",
    name: "Michał Dąbrowski",
    position: "Pomocnik budowlany",
    image: null,
    baseEarnings: 4200,
    qualityBonus: 420,
    totalEarnings: 4620,
    totalHours: 140,
    tasksCompleted: 8,
    qualityScore: 87,
    paymentStatus: "PAID",
    paymentDate: "2024-01-25",
    paymentMethod: "Gotówka"
  },
  {
    userId: "8",
    employeeId: "EMP-008",
    name: "Agnieszka Wójcik",
    position: "Dekarz",
    image: null,
    baseEarnings: 6200,
    qualityBonus: 930,
    totalEarnings: 7130,
    totalHours: 162,
    tasksCompleted: 10,
    qualityScore: 93,
    paymentStatus: "PENDING",
    paymentDate: "2024-02-01",
    paymentMethod: "Przelew bankowy"
  }
];

export function usePayroll(filters?: PayrollFilters) {
  const [payrollData, setPayrollData] = useState<EmployeePayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filteredData = [...mockPayrollData];
        
        // Apply filters
        if (filters?.status) {
          filteredData = filteredData.filter(emp => emp.paymentStatus === filters.status);
        }
        
        if (filters?.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filteredData = filteredData.filter(emp => 
            emp.name?.toLowerCase().includes(query) ||
            emp.employeeId?.toLowerCase().includes(query) ||
            emp.position?.toLowerCase().includes(query)
          );
        }
        
        setPayrollData(filteredData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania danych o płacach");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayroll();
  }, [filters?.status, filters?.payPeriod, filters?.amountRange, filters?.searchQuery]);

  return { payrollData, isLoading, error };
}