"use client";

import { Users, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { EmployeeStatistics } from "../types/employee.types";

interface TeamOverviewProps {
  statistics: EmployeeStatistics;
}

export function TeamOverview({ statistics }: TeamOverviewProps) {
  const stats = [
    {
      title: "Wszyscy pracownicy",
      value: statistics.totalEmployees,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Aktywni",
      value: statistics.activeEmployees,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Na urlopie",
      value: statistics.onLeaveEmployees,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Tymczasowi",
      value: statistics.temporaryEmployees,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}