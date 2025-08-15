"use client";

import { Phone, MessageSquare, MapPin, Calendar, Wrench, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { EmployeeWithRelations } from "../types/employee.types";
import { EMPLOYMENT_TYPE_LABELS, QUALITY_SCORE_COLORS, QUALITY_SCORE_THRESHOLDS } from "../constants/employee.constants";

interface EmployeeCardProps {
  employee: EmployeeWithRelations;
  onClick: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const activeTasks = employee.taskAssignments.filter(
    (assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.status !== "PAID"
  ).length;
  
  const completedTasks = employee.taskAssignments.filter(
    (assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.status === "PAID"
  ).length;
  
  const assignedEquipment = employee.equipmentAssignments.filter(
    (assignment: EmployeeWithRelations['equipmentAssignments'][0]) => assignment.isActive && !assignment.returnDate
  ).length;
  
  const qualityScore = calculateAverageQualityScore(employee);
  const qualityScoreColor = getQualityScoreColor(qualityScore);
  const attendanceRate = calculateAttendanceRate(employee);
  const daysSinceAssignment = calculateDaysSinceAssignment(employee);
  const lastActivity = getLastActivity(employee);
  const currentProject = getCurrentProject(employee);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-4 sm:p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={employee.image || undefined}
            alt={employee.name || ""}
            size="lg"
            className="ring-2 ring-gray-100"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{employee.name || "Nieznany"}</h3>
            <p className="text-sm text-gray-600">{employee.position || "Stanowisko nieznane"}</p>
          </div>
        </div>
        <EmployeeStatusBadge employee={employee} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        {employee.phone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${employee.phone}`;
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle message action
          }}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Assignment Information */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Przydzielony: {daysSinceAssignment} dni</span>
        </div>
        {currentProject && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{currentProject}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4" />
          <span>{activeTasks} aktywnych zadań</span>
        </div>
        {lastActivity && (
          <p className="text-xs text-gray-500">Ostatnia aktywność: {lastActivity}</p>
        )}
      </div>

      {/* Equipment Summary */}
      <div className="border-t pt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {assignedEquipment} przydzielonych przedmiotów
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle view equipment
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Zobacz wszystko
          </button>
        </div>
        <p className="text-xs text-gray-600">
          {assignedEquipment > 0 ? "Wszystkie zwrócone" : "Brak przydzielonego sprzętu"}
        </p>
      </div>

      {/* Performance Indicators */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={`text-lg font-bold ${qualityScoreColor}`}>{qualityScore}%</p>
            <p className="text-xs text-gray-600">Jakość</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {completedTasks}/{completedTasks + activeTasks}
            </p>
            <p className="text-xs text-gray-600">Zadania</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{attendanceRate}%</p>
            <p className="text-xs text-gray-600">Obecność</p>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeStatusBadge({ employee }: { employee: EmployeeWithRelations }) {
  if (!employee.isActive) {
    return <Badge variant="neutral">Nieaktywny</Badge>;
  }
  
  const hasActiveLeave = employee.leaveRequests.some(
    (leave: EmployeeWithRelations['leaveRequests'][0]) => leave.status === "APPROVED" && 
    new Date(leave.startDate) <= new Date() &&
    new Date(leave.endDate) >= new Date()
  );
  
  if (hasActiveLeave) {
    return <Badge variant="warning">Na urlopie</Badge>;
  }
  
  if (employee.employmentType === "TEMPORARY") {
    return <Badge variant="primary">Tymczasowy</Badge>;
  }
  
  return <Badge variant="success">Aktywny</Badge>;
}

function calculateAverageQualityScore(employee: EmployeeWithRelations): number {
  const qualityControls = employee.taskAssignments.flatMap(
    (assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.qualityControls
  );
  
  if (qualityControls.length === 0) return 0;
  
  const totalScore = qualityControls.reduce(
    (sum: number, control: EmployeeWithRelations['taskAssignments'][0]['task']['qualityControls'][0]) => sum + control.completionRate,
    0
  );
  
  return Math.round(totalScore / qualityControls.length);
}

function getQualityScoreColor(score: number): string {
  if (score >= QUALITY_SCORE_THRESHOLDS.EXCELLENT) return QUALITY_SCORE_COLORS.EXCELLENT;
  if (score >= QUALITY_SCORE_THRESHOLDS.GOOD) return QUALITY_SCORE_COLORS.GOOD;
  if (score >= QUALITY_SCORE_THRESHOLDS.AVERAGE) return QUALITY_SCORE_COLORS.AVERAGE;
  return QUALITY_SCORE_COLORS.POOR;
}

function calculateAttendanceRate(employee: EmployeeWithRelations): number {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentAttendance = employee.attendanceRecords.filter(
    (record: EmployeeWithRelations['attendanceRecords'][0]) => new Date(record.date) >= last30Days
  );
  
  if (recentAttendance.length === 0) return 100;
  
  const presentDays = recentAttendance.filter(
    (record: EmployeeWithRelations['attendanceRecords'][0]) => record.checkIn && record.checkOut
  ).length;
  
  return Math.round((presentDays / recentAttendance.length) * 100);
}

function calculateDaysSinceAssignment(employee: EmployeeWithRelations): number {
  const activeAssignment = employee.projectAssignments.find(
    (assignment: EmployeeWithRelations['projectAssignments'][0]) => assignment.isActive
  );
  
  if (!activeAssignment) return 0;
  
  const daysDiff = Math.floor(
    (new Date().getTime() - new Date(activeAssignment.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  
  return daysDiff;
}

function getLastActivity(employee: EmployeeWithRelations): string | null {
  const lastTaskUpdate = employee.taskAssignments
    .map((assignment: EmployeeWithRelations['taskAssignments'][0]) => assignment.task.updatedAt)
    .sort((a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime())[0];
  
  if (!lastTaskUpdate) return null;
  
  return formatDistanceToNow(new Date(lastTaskUpdate), {
    addSuffix: true,
    locale: pl,
  });
}

function getCurrentProject(employee: EmployeeWithRelations): string | null {
  const activeAssignment = employee.projectAssignments.find(
    (assignment: EmployeeWithRelations['projectAssignments'][0]) => assignment.isActive
  );
  
  if (!activeAssignment) return null;
  
  return activeAssignment.project.name;
}