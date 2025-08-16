import { z } from 'zod';
import { coordinateSchema, timeSlotSchema } from '../common';

// Attendance validation with business rules
export const attendanceSchema = z.object({
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  
  checkIn: z.coerce.date()
    .refine(date => {
      const hour = date.getHours();
      return hour >= 5 && hour <= 20; // Business hours 5 AM - 8 PM
    }, 'Check-in outside allowed hours'),
  
  checkOut: z.coerce.date().optional(),
  
  location: coordinateSchema,
  
  breaks: z.array(z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    type: z.enum(['lunch', 'rest', 'other']),
    reason: z.string().max(200).optional(),
  })).optional(),
  
  overtime: z.object({
    hours: z.number().min(0).max(8),
    reason: z.string().min(10, 'Overtime reason required'),
    approved: z.boolean().default(false),
    approvedBy: z.string().uuid().optional(),
  }).optional(),
  
  notes: z.string().max(500).optional(),
  
  verificationMethod: z.enum(['gps', 'qr_code', 'manual', 'biometric']).default('gps'),
}).refine(data => {
  if (data.checkOut && data.checkIn) {
    return data.checkOut > data.checkIn;
  }
  return true;
}, 'Check-out must be after check-in').refine(data => {
  if (data.checkOut && data.checkIn) {
    const duration = (data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60);
    return duration <= 16; // Max 16 hours shift
  }
  return true;
}, 'Shift duration cannot exceed 16 hours');

// Bulk attendance upload
export const bulkAttendanceSchema = z.object({
  projectId: z.string().uuid(),
  date: z.coerce.date(),
  entries: z.array(z.object({
    userId: z.string().uuid(),
    checkIn: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    checkOut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    breaks: z.number().min(0).max(120).optional(), // Break time in minutes
    overtimeHours: z.number().min(0).max(8).optional(),
  })).min(1).max(100),
});

// Attendance report filters
export const attendanceReportSchema = z.object({
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  includeOvertime: z.boolean().default(true),
  includeBreaks: z.boolean().default(true),
  groupBy: z.enum(['day', 'week', 'month', 'user', 'project']).default('day'),
}).refine(data => data.dateTo >= data.dateFrom, {
  message: 'End date must be after start date',
  path: ['dateTo'],
});

// Time correction request
export const timeCorrectionSchema = z.object({
  attendanceId: z.string().uuid(),
  correctionType: z.enum(['check_in', 'check_out', 'break', 'full']),
  originalTime: z.coerce.date(),
  correctedTime: z.coerce.date(),
  reason: z.string().min(10).max(500),
  supportingDocuments: z.array(z.string().uuid()).optional(),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>;
export type TimeCorrectionInput = z.infer<typeof timeCorrectionSchema>;