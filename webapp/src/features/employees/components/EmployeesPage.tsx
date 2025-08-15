"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { TeamOverview } from "./TeamOverview";
import { PayrollEarnings } from "./PayrollEarnings";
import type { EmployeeTab } from "../types/employee.types";

const TAB_OPTIONS = [
  { value: "team" as EmployeeTab, label: "👥 Przegląd zespołu" },
  { value: "payroll" as EmployeeTab, label: "💰 Płace i zarobki" },
];

export function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<EmployeeTab>("team");

  const currentTab = TAB_OPTIONS.find((tab) => tab.value === activeTab);

  // Mock data - dane przykładowe
  const mockStatistics = {
    totalEmployees: 24,
    activeEmployees: 20,
    onLeaveEmployees: 2,
    temporaryEmployees: 2,
    totalEquipmentAssigned: 48,
    activeEquipment: 42,
    inRepairEquipment: 6,
    activeTasks: 32,
    completedTasksThisWeek: 18,
    averageQualityScore: 94,
    taskCompletionRate: 88,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pracownicy</h1>
        
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="font-medium">{currentTab?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          }
          items={TAB_OPTIONS.map((option) => ({
            id: option.value,
            label: option.label,
            onClick: () => setActiveTab(option.value),
          }))}
          align="right"
        />
      </div>

      <div className="transition-all duration-300">
        {activeTab === "team" ? <TeamOverview statistics={mockStatistics} /> : <PayrollEarnings />}
      </div>
    </div>
  );
}