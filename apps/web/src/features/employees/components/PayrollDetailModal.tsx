"use client";

import { X, Calendar, Clock, Award, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "../utils/currency";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "../constants/employee.constants";
import type { EmployeePayrollData } from "../types/employee.types";

interface PayrollDetailModalProps {
  payrollData: EmployeePayrollData;
  isOpen: boolean;
  onClose: () => void;
}

export function PayrollDetailModal({ payrollData, isOpen, onClose }: PayrollDetailModalProps) {
  const paymentStatusColor = PAYMENT_STATUS_COLORS[payrollData.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || PAYMENT_STATUS_COLORS.PENDING;
  const paymentStatusLabel = PAYMENT_STATUS_LABELS[payrollData.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] || payrollData.paymentStatus;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Rozkład zarobków">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rozkład zarobków</h2>
            <p className="text-gray-600 mt-1">Szczegółowe informacje o wynagrodzeniu</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <img
            src={payrollData.image || "/default-avatar.png"}
            alt={payrollData.name || ""}
            className="w-16 h-16 rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{payrollData.name || "Unknown"}</h3>
            <p className="text-gray-600">{payrollData.position || "Unknown Position"}</p>
            <p className="text-sm text-gray-500">ID: {payrollData.employeeId || "N/A"}</p>
          </div>
          <Badge variant="primary" className={paymentStatusColor}>
            {paymentStatusLabel}
          </Badge>
        </div>

        {/* Pay Period */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Okres płatności</h4>
          </div>
          <p className="text-gray-600">Bieżący miesiąc</p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Work Summary */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Podsumowanie pracy</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-600">Przepracowane godziny</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{payrollData.totalHours}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-600">Ukończone zadania</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{payrollData.tasksCompleted}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <p className="text-sm text-purple-600">Ocena jakości</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{payrollData.qualityScore}%</p>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Rozkład zarobków</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Podstawowe zarobki</span>
              <span className="font-medium">{formatCurrency(payrollData.baseEarnings)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-600">Bonus jakościowy</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(payrollData.qualityBonus)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded border-t-2 border-gray-300">
              <span className="font-semibold text-gray-900">Łączne zarobki</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(payrollData.totalEarnings)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {payrollData.paymentDate && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Informacje o płatności</h4>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                {payrollData.paymentStatus === "PAID" ? "Data płatności: " : "Termin płatności: "}
                <span className="font-medium">
                  {new Date(payrollData.paymentDate).toLocaleDateString("pl-PL")}
                </span>
              </p>
              {payrollData.paymentMethod && (
                <p className="text-sm text-gray-700">
                  Metoda płatności: <span className="font-medium">{payrollData.paymentMethod}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {payrollData.paymentStatus === "PENDING" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Płatność oczekująca</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Ta płatność oczekuje na przetworzenie. Upewnij się, że cała praca została zweryfikowana przed przetworzeniem płatności.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
          <Button variant="outline">
            Wygeneruj odcinek płatności
          </Button>
          {payrollData.paymentStatus === "PENDING" && (
            <Button variant="primary">
              Przetwórz płatność
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}