export interface AttendanceEntry {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number;
  projectId: string;
  projectName: string;
  userId: string;
  status: 'working' | 'completed' | 'absent';
  overtimeHours?: number;
}

export interface WeekSummary {
  totalHours: number;
  daysWorked: number;
  overtimeHours: number;
  regularHours: number;
  weekNumber: number;
  year: number;
}

export interface AttendanceStats {
  monthlyHours: number;
  monthlyDays: number;
  averageHoursPerDay: number;
  totalOvertime: number;
}