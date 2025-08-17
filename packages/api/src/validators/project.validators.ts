import { z } from 'zod';
import { idSchema, paginationSchema, searchSchema, sortSchema, dateRangeSchema } from './common.validators';

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  developerId: idSchema,
  coordinatorId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  address: z.string().min(1).optional(),
  developerId: idSchema.optional(),
  coordinatorId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

const baseDateRange = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const listProjectsSchema = paginationSchema.merge(searchSchema).merge(sortSchema).merge(baseDateRange).merge(z.object({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  developerId: idSchema.optional(),
  coordinatorId: idSchema.optional(),
  minBudget: z.coerce.number().positive().optional(),
  maxBudget: z.coerce.number().positive().optional(),
})).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before end date',
});

export const getProjectSchema = z.object({
  id: idSchema,
});

export const deleteProjectSchema = z.object({
  id: idSchema,
});

export const projectEmployeesSchema = z.object({
  projectId: idSchema,
}).merge(paginationSchema).merge(searchSchema);

export const addProjectEmployeeSchema = z.object({
  projectId: idSchema,
  userId: idSchema,
  role: z.string().min(1, 'Role is required'),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
});

export const removeProjectEmployeeSchema = z.object({
  projectId: idSchema,
  userId: idSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type GetProjectInput = z.infer<typeof getProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type ProjectEmployeesInput = z.infer<typeof projectEmployeesSchema>;
export type AddProjectEmployeeInput = z.infer<typeof addProjectEmployeeSchema>;
export type RemoveProjectEmployeeInput = z.infer<typeof removeProjectEmployeeSchema>;