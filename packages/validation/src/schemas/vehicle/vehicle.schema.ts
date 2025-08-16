import { z } from 'zod';
import { dateSchema, moneySchema, coordinateSchema } from '../common';

// Vehicle registration
export const vehicleSchema = z.object({
  registrationNumber: z.string()
    .regex(/^[A-Z]{2,3}\s?\d{4,5}[A-Z]{0,2}$/, 'Invalid Polish registration number')
    .transform(s => s.replace(/\s/g, '').toUpperCase()),
  
  make: z.string().min(2).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  
  type: z.enum(['car', 'van', 'truck', 'bus', 'motorcycle', 'equipment']),
  
  vin: z.string()
    .length(17)
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN')
    .optional(),
  
  color: z.string().max(30).optional(),
  
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'lpg']).optional(),
  
  insurance: z.object({
    policyNumber: z.string().max(50),
    provider: z.string().max(100),
    validUntil: dateSchema,
    type: z.enum(['liability', 'comprehensive', 'collision']),
  }),
  
  inspection: z.object({
    lastDate: dateSchema,
    nextDate: dateSchema,
    mileage: z.number().min(0).max(999999),
  }),
  
  assignedTo: z.string().uuid().optional(),
  assignedProject: z.string().uuid().optional(),
  
  status: z.enum(['active', 'maintenance', 'repair', 'inactive']).default('active'),
});

// Vehicle usage log
export const vehicleUsageSchema = z.object({
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  
  startLocation: coordinateSchema,
  endLocation: coordinateSchema.optional(),
  
  startMileage: z.number().min(0),
  endMileage: z.number().min(0).optional(),
  
  purpose: z.string().min(10).max(200),
  
  fuelAdded: z.object({
    liters: z.number().min(0).max(500),
    cost: moneySchema,
    location: z.string().max(200),
  }).optional(),
  
  incidents: z.array(z.object({
    type: z.enum(['accident', 'breakdown', 'fine', 'other']),
    description: z.string().max(500),
    cost: moneySchema.optional(),
    reportedTo: z.enum(['police', 'insurance', 'none']).optional(),
  })).optional(),
}).refine(data => {
  if (data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, 'End time must be after start time').refine(data => {
  if (data.endMileage) {
    return data.endMileage >= data.startMileage;
  }
  return true;
}, 'End mileage must be greater than start mileage');

// Vehicle maintenance
export const vehicleMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  
  type: z.enum(['oil_change', 'tire_rotation', 'brake_service', 'inspection', 'repair', 'other']),
  description: z.string().max(500),
  
  performedAt: z.coerce.date(),
  performedBy: z.string().max(200),
  
  mileage: z.number().min(0),
  
  cost: z.object({
    parts: moneySchema,
    labor: moneySchema,
    total: moneySchema,
  }).refine(data => {
    const calculated = data.parts + data.labor;
    return Math.abs(calculated - data.total) < 0.01;
  }, 'Total cost must equal parts + labor'),
  
  nextServiceDue: z.object({
    date: dateSchema.optional(),
    mileage: z.number().optional(),
  }).optional(),
  
  warranty: z.object({
    duration: z.number().min(1).max(60), // months
    coverage: z.string().max(200),
  }).optional(),
  
  documents: z.array(z.string().uuid()).optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleUsageInput = z.infer<typeof vehicleUsageSchema>;
export type VehicleMaintenanceInput = z.infer<typeof vehicleMaintenanceSchema>;