"use client";

import { X, Phone, Mail, Calendar, MapPin, Wrench, CheckCircle, TrendingUp, Award } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { EmployeeWithRelations } from "../types/employee.types";
import { EMPLOYMENT_TYPE_LABELS } from "../constants/employee.constants";

interface EmployeeDetailModalProps {
  employee: EmployeeWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDetailModal({ employee, isOpen, onClose }: EmployeeDetailModalProps) {
  const activeEquipment = employee.equipmentAssignments.filter(
    (assignment: EmployeeWithRelations['equipmentAssignments'][0]) => assignment.isActive && !assignment.returnDate
  );

  const activeTasks = employee.taskAssignments.filter(
    (assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.status !== "PAID"
  );

  const completedTasks = employee.taskAssignments.filter(
    (assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.status === "PAID"
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee.name || "Szczegóły pracownika"} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={employee.image || undefined}
              alt={employee.name || ""}
              size="xl"
              className="ring-4 ring-gray-100"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name || "Nieznany"}</h2>
              <p className="text-gray-600">{employee.position || "Stanowisko nieznane"}</p>
              <p className="text-sm text-gray-500">ID: {employee.employeeId || employee.id}</p>
              <div className="flex items-center gap-4 mt-2">
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Phone className="w-4 h-4" />
                    {employee.phone}
                  </a>
                )}
                {employee.email && (
                  <a
                    href={`mailto:${employee.email}`}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Data zatrudnienia</p>
            <p className="font-medium">
              {employee.employmentStartDate
                ? format(new Date(employee.employmentStartDate), "dd MMMM yyyy", { locale: pl })
                : "Nieznana"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Typ zatrudnienia</p>
            <p className="font-medium">
              {EMPLOYMENT_TYPE_LABELS[employee.employmentType as keyof typeof EMPLOYMENT_TYPE_LABELS] || employee.employmentType}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Departament</p>
            <p className="font-medium">{employee.department || "Nieprzypisany"}</p>
          </div>
        </div>

        {/* Equipment Section */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Wrench className="w-5 h-5" />
            Przydzielony sprzęt ({activeEquipment.length} przedmiotów)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeEquipment.map((assignment: EmployeeWithRelations['equipmentAssignments'][0]) => (
              <div
                key={assignment.id}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg"
              >
                {assignment.equipment.imageUrl && (
                  <img
                    src={assignment.equipment.imageUrl}
                    alt={assignment.equipment.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{assignment.equipment.name}</p>
                  <p className="text-xs text-gray-600">
                    Przydzielony: {format(new Date(assignment.assignedDate), "dd.MM.yyyy")}
                  </p>
                </div>
                <Badge
                  variant={assignment.equipment.status === "ASSIGNED" ? "success" : "warning"}
                  size="sm"
                >
                  {assignment.equipment.status === "ASSIGNED" ? "Aktywny" : "W naprawie"}
                </Badge>
              </div>
            ))}
          </div>
          {activeEquipment.length === 0 && (
            <p className="text-gray-500 text-sm">Brak przydzielonego sprzętu</p>
          )}
        </div>

        {/* Tasks Section */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <CheckCircle className="w-5 h-5" />
            Zadania
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Aktywne zadania</p>
              <p className="text-2xl font-bold text-blue-900">{activeTasks.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Ukończone w tym miesiącu</p>
              <p className="text-2xl font-bold text-green-900">{completedTasks.length}</p>
            </div>
          </div>
          
          {/* Recent Tasks */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ostatnie zadania</h4>
            {activeTasks.slice(0, 3).map((assignment: EmployeeWithRelations['taskAssignments'][0]) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{assignment.task.title}</p>
                  <p className="text-xs text-gray-600">
                    Projekt: {assignment.task.project?.name || "Nieznany"}
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  {assignment.task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Section */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <TrendingUp className="w-5 h-5" />
            Wydajność
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">92%</p>
              <p className="text-sm text-gray-600">Średnia jakość</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">85%</p>
              <p className="text-sm text-gray-600">Ukończone zadania</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">98%</p>
              <p className="text-sm text-gray-600">Obecność</p>
            </div>
          </div>
        </div>

        {/* Skills & Certifications */}
        {(employee.skills || employee.certifications) && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Award className="w-5 h-5" />
              Umiejętności i certyfikaty
            </h3>
            {employee.skills && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Umiejętności</p>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.split(",").map((skill: string, index: number) => (
                    <Badge key={index} variant="neutral" size="sm">
                      {skill.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {employee.certifications && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Certyfikaty</p>
                <div className="flex flex-wrap gap-2">
                  {employee.certifications.split(",").map((cert: string, index: number) => (
                    <Badge key={index} variant="primary" size="sm">
                      {cert.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
          <Button>Edytuj pracownika</Button>
          <Button>Generuj raport</Button>
        </div>
      </div>
    </Modal>
  );
}