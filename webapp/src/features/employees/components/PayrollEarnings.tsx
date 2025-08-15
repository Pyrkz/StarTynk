"use client";

import { useState } from "react";
import { DollarSign, Clock, TrendingUp, Target, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PayrollDetailModal } from "./PayrollDetailModal";
import { usePayroll } from "../hooks/usePayroll";
import { usePayrollStatistics } from "../hooks/usePayrollStatistics";
import { formatCurrency } from "../utils/currency";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "../constants/employee.constants";
import type { EmployeePayrollData } from "../types/employee.types";

export function PayrollEarnings() {
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayrollData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { payrollData, isLoading: isLoadingPayroll } = usePayroll();
  const { statistics, isLoading: isLoadingStats } = usePayrollStatistics();

  const isLoading = isLoadingPayroll || isLoadingStats;

  const filteredPayrollData = payrollData.filter((employee) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(query) ||
      employee.employeeId?.toLowerCase().includes(query) ||
      employee.position?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatisticsCard
            icon={<DollarSign className="w-8 h-8 text-green-600" />}
            title="Miesięczne wynagrodzenia"
            value={formatCurrency(statistics?.monthlyPayrollTotal || 0)}
            comparison={"+2 100 zł w porównaniu do ubiegłego miesiąca"}
            breakdown={`${statistics?.totalEmployees || 0} pracowników przetworzonych`}
          />
          
          <StatisticsCard
            icon={<Clock className="w-8 h-8 text-yellow-600" />}
            title="Zaległe płatności"
            value={formatCurrency(statistics?.outstandingPayments || 0)}
            details={`${statistics?.pendingPaymentsCount || 0} pracowników oczekuje na wypłatę`}
            urgency={`${statistics?.overduePaymentsCount || 0} przeterminowanych płatności`}
            urgencyColor="text-red-600"
          />
          
          <StatisticsCard
            icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
            title="Średnia stawka godzinowa"
            value={`${statistics?.averageHourlyRate || 0} zł/godz`}
            range={`${statistics?.hourlyRateRange?.min || 0}-${statistics?.hourlyRateRange?.max || 0} zł zakres`}
            trend={"+1,20 zł w porównaniu do ubiegłego kwartału"}
          />
          
          <StatisticsCard
            icon={<Target className="w-8 h-8 text-purple-600" />}
            title="Pula bonusów jakościowych"
            value={formatCurrency(statistics?.qualityBonusPool || 0)}
            distribution={`${statistics?.eligibleEmployeesPercentage || 0}% zespołu kwalifikuje się`}
            performance="Wyniki powyżej celu"
          />
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Szczegóły płac</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Szukaj pracowników..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtry
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Eksport
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pracownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Podsumowanie pracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rozkład zarobków
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status płatności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayrollData.map((employee) => (
                  <PayrollTableRow
                    key={employee.userId}
                    employee={employee}
                    onViewDetails={() => setSelectedPayroll(employee)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {filteredPayrollData.map((employee) => (
              <PayrollMobileCard
                key={employee.userId}
                employee={employee}
                onViewDetails={() => setSelectedPayroll(employee)}
              />
            ))}
          </div>

          {filteredPayrollData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nie znaleziono danych o płacach</p>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Detail Modal */}
      {selectedPayroll && (
        <PayrollDetailModal
          payrollData={selectedPayroll}
          isOpen={!!selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
        />
      )}
    </>
  );
}

interface StatisticsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  comparison?: string;
  breakdown?: string;
  details?: string;
  urgency?: string;
  urgencyColor?: string;
  range?: string;
  trend?: string;
  distribution?: string;
  performance?: string;
}

function StatisticsCard({
  icon,
  title,
  value,
  comparison,
  breakdown,
  details,
  urgency,
  urgencyColor = "text-gray-600",
  range,
  trend,
  distribution,
  performance,
}: StatisticsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        {icon}
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      
      {comparison && (
        <p className="text-sm text-gray-600 mb-1">{comparison}</p>
      )}
      
      {breakdown && (
        <p className="text-sm text-gray-600">{breakdown}</p>
      )}
      
      {details && (
        <p className="text-sm text-gray-600 mb-1">{details}</p>
      )}
      
      {urgency && (
        <p className={`text-sm font-medium ${urgencyColor}`}>{urgency}</p>
      )}
      
      {range && (
        <p className="text-sm text-gray-600 mb-1">{range}</p>
      )}
      
      {trend && (
        <p className="text-sm text-green-600 font-medium">{trend}</p>
      )}
      
      {distribution && (
        <p className="text-sm text-gray-600 mb-1">{distribution}</p>
      )}
      
      {performance && (
        <p className="text-sm text-green-600 font-medium">{performance}</p>
      )}
    </div>
  );
}

interface PayrollTableRowProps {
  employee: EmployeePayrollData;
  onViewDetails: () => void;
}

function PayrollTableRow({ employee, onViewDetails }: PayrollTableRowProps) {
  const paymentStatusColor = PAYMENT_STATUS_COLORS[employee.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || PAYMENT_STATUS_COLORS.PENDING;
  const paymentStatusLabel = PAYMENT_STATUS_LABELS[employee.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] || employee.paymentStatus;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            className="h-10 w-10 rounded-full"
            src={employee.image || "/default-avatar.png"}
            alt={employee.name || ""}
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{employee.name || "Unknown"}</div>
            <div className="text-sm text-gray-500">{employee.employeeId || "N/A"}</div>
            <div className="text-xs text-gray-400">{employee.position || "Unknown Position"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{employee.tasksCompleted} ukończonych zadań</div>
        <div className="text-sm text-gray-500">{employee.totalHours} przepracowanych godzin</div>
        <div className="text-sm text-gray-600 font-medium">{employee.qualityScore}% jakość</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">Podstawa: {formatCurrency(employee.baseEarnings)}</div>
        <div className="text-sm text-green-600">+{formatCurrency(employee.qualityBonus)}</div>
        <div className="text-base font-bold text-gray-900">{formatCurrency(employee.totalEarnings)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="neutral" className={paymentStatusColor}>
          {paymentStatusLabel}
        </Badge>
        {employee.paymentDate && (
          <div className="text-xs text-gray-500 mt-1">
            {employee.paymentStatus === "PAID" ? "Zapłacono: " : "Termin: "}
            {new Date(employee.paymentDate).toLocaleDateString()}
          </div>
        )}
        {employee.paymentMethod && (
          <div className="text-xs text-gray-400">{employee.paymentMethod}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={onViewDetails}
          className="text-blue-600 hover:text-blue-800 mr-3"
        >
          Zobacz szczegóły
        </button>
        {employee.paymentStatus === "PENDING" && (
          <button className="text-green-600 hover:text-green-800">
            Przetwórz płatność
          </button>
        )}
      </td>
    </tr>
  );
}

interface PayrollMobileCardProps {
  employee: EmployeePayrollData;
  onViewDetails: () => void;
}

function PayrollMobileCard({ employee, onViewDetails }: PayrollMobileCardProps) {
  const paymentStatusColor = PAYMENT_STATUS_COLORS[employee.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || PAYMENT_STATUS_COLORS.PENDING;
  const paymentStatusLabel = PAYMENT_STATUS_LABELS[employee.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] || employee.paymentStatus;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      {/* Employee Info */}
      <div className="flex items-center gap-3 mb-4">
        <img
          className="h-12 w-12 rounded-full"
          src={employee.image || "/default-avatar.png"}
          alt={employee.name || ""}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{employee.name || "Unknown"}</h3>
          <p className="text-sm text-gray-600">{employee.position || "Unknown Position"}</p>
          <p className="text-xs text-gray-500">ID: {employee.employeeId || "N/A"}</p>
        </div>
        <Badge variant="neutral" className={paymentStatusColor + " text-xs"}>
          {paymentStatusLabel}
        </Badge>
      </div>

      {/* Work Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-600">Zadania</p>
          <p className="font-semibold text-sm">{employee.tasksCompleted}</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-600">Godziny</p>
          <p className="font-semibold text-sm">{employee.totalHours}</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-600">Jakość</p>
          <p className="font-semibold text-sm">{employee.qualityScore}%</p>
        </div>
      </div>

      {/* Earnings */}
      <div className="border-t pt-3 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Podstawowe zarobki</span>
          <span className="text-sm font-medium">{formatCurrency(employee.baseEarnings)}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Bonusy</span>
          <span className="text-sm font-medium text-green-600">+{formatCurrency(employee.qualityBonus)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold">Łącznie</span>
          <span className="font-bold text-lg">{formatCurrency(employee.totalEarnings)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Zobacz szczegóły
        </button>
        {employee.paymentStatus === "PENDING" && (
          <button className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
            Przetwórz płatność
          </button>
        )}
      </div>
    </div>
  );
}