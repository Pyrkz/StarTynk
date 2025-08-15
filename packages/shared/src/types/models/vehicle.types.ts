import { VehicleStatus, MaintenanceType, ReminderType } from '../enums';
import { User } from './user.types';

/**
 * Vehicle model representing company vehicles
 */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  insuranceExpiry: Date | string | null;
  inspectionExpiry: Date | string | null;
  purchaseDate: Date | string | null;
  purchasePrice: number | string | null; // Decimal as string for precision
  status: VehicleStatus;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  assignments?: VehicleAssignment[];
  maintenances?: VehicleMaintenance[];
  reminders?: VehicleReminder[];
}

/**
 * Vehicle assignment to users
 */
export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: Date | string;
  endDate: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  vehicle?: Vehicle;
  user?: User;
}

/**
 * Vehicle maintenance records
 */
export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number | string; // Decimal as string for precision
  serviceDate: Date | string;
  nextDueDate: Date | string | null;
  mileage: number | null;
  serviceProvider: string | null;
  invoiceUrl: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  // Relations
  vehicle?: Vehicle;
}

/**
 * Vehicle reminder for maintenance and inspections
 */
export interface VehicleReminder {
  id: string;
  vehicleId: string;
  type: ReminderType;
  dueDate: Date | string;
  description: string;
  daysBefore: number;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  vehicle?: Vehicle;
}