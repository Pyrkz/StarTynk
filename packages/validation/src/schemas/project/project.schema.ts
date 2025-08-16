import { z } from 'zod';
import { moneySchema, dateRangeSchema, coordinateSchema, addressSchema } from '../common';

export const createProjectSchema = z.object({
  name: z.string()
    .min(3, 'Project name too short')
    .max(100, 'Project name too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid characters in project name'),
  
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  
  address: addressSchema,
  
  coordinates: coordinateSchema.optional(),
  
  developerId: z.string().uuid(),
  
  dates: dateRangeSchema,
  
  budget: z.object({
    total: moneySchema,
    labor: moneySchema.optional(),
    materials: moneySchema.optional(),
    contingency: moneySchema.optional(),
  }).refine(data => {
    const sum = (data.labor || 0) + (data.materials || 0) + (data.contingency || 0);
    return sum <= data.total;
  }, 'Budget breakdown exceeds total budget'),
  
  assignedUsers: z.array(z.string().uuid()).min(1, 'At least one user must be assigned'),
  
  metadata: z.object({
    permitNumber: z.string().optional(),
    contractNumber: z.string().optional(),
    insurancePolicy: z.string().optional(),
    constructionType: z.enum(['residential', 'commercial', 'industrial', 'infrastructure']).optional(),
    projectPhase: z.enum(['planning', 'design', 'construction', 'finishing', 'completed']).optional(),
  }).optional(),
  
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ developerId: true });

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  developerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  budgetMin: moneySchema.optional(),
  budgetMax: moneySchema.optional(),
  assignedUserId: z.string().uuid().optional(),
});

export const projectTaskSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  assignedTo: z.array(z.string().uuid()).min(1),
  dueDate: z.coerce.date(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedHours: z.number().min(0.5).max(999).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
export type ProjectTaskInput = z.infer<typeof projectTaskSchema>;