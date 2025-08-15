import type { 
  LeaveType,
  LeaveStatus,
  PaymentStatus,
  PaymentMethod,
  BonusType,
  DeductionType
} from '@repo/database';

/**
 * Attendance record model
 */
export interface Attendance {
  id: string;
  userId: string;
  projectId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  hoursWorked: number | null;
  overtimeHours: number | null;
  status: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Leave request model
 */
export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  status: LeaveStatus;
  approvedById: string | null;
  approvedDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payroll record model
 */
export interface Payroll {
  id: string;
  userId: string;
  projectId: string | null;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  hoursWorked: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bonus model
 */
export interface Bonus {
  id: string;
  userId: string;
  payrollId: string | null;
  type: BonusType;
  amount: number;
  description: string | null;
  date: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deduction model
 */
export interface Deduction {
  id: string;
  userId: string;
  payrollId: string | null;
  type: DeductionType;
  amount: number;
  description: string | null;
  date: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}