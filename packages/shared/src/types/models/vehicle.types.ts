import type { 
  VehicleStatus,
  MaintenanceType,
  ReminderType
} from '@repo/database';

/**
 * Vehicle model
 */
export interface Vehicle {
  /** Unique identifier */
  id: string;
  
  /** Vehicle make */
  make: string;
  
  /** Vehicle model */
  model: string;
  
  /** Vehicle year */
  year: number;
  
  /** License plate number */
  licensePlate: string;
  
  /** VIN number */
  vin: string | null;
  
  /** Insurance expiry date */
  insuranceExpiry: Date | null;
  
  /** Inspection expiry date */
  inspectionExpiry: Date | null;
  
  /** Purchase date */
  purchaseDate: Date | null;
  
  /** Purchase price */
  purchasePrice: number | null;
  
  /** Current vehicle status */
  status: VehicleStatus;
  
  /** Whether the vehicle is active */
  isActive: boolean;
  
  /** ISO 8601 timestamp of creation */
  createdAt: Date;
  
  /** ISO 8601 timestamp of last update */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/**
 * Vehicle assignment model
 */
export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vehicle maintenance model
 */
export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  serviceDate: Date;
  nextDueDate: Date | null;
  mileage: number | null;
  serviceProvider: string | null;
  invoiceUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Vehicle reminder model
 */
export interface VehicleReminder {
  id: string;
  vehicleId: string;
  type: ReminderType;
  dueDate: Date;
  description: string;
  daysBefore: number;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}