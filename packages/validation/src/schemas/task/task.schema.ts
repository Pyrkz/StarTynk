import { z } from 'zod';
import { dateSchema } from '../common';

// Task creation
export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string()
    .min(3, 'Task title too short')
    .max(200, 'Task title too long'),
  
  description: z.string()
    .max(2000, 'Description too long')
    .optional(),
  
  type: z.enum(['construction', 'inspection', 'documentation', 'meeting', 'other']).default('construction'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'cancelled']).default('todo'),
  
  assignees: z.array(z.string().uuid()).min(1, 'At least one assignee required'),
  
  dueDate: dateSchema,
  
  estimatedHours: z.number().min(0.5).max(999).optional(),
  
  dependencies: z.array(z.string().uuid()).optional(),
  
  tags: z.array(z.string().max(30)).max(10).optional(),
  
  checklist: z.array(z.object({
    item: z.string().max(200),
    completed: z.boolean().default(false),
  })).max(20).optional(),
  
  location: z.object({
    name: z.string().max(200),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),
  
  attachments: z.array(z.string().uuid()).max(10).optional(),
});

// Task update
export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: z.coerce.date().optional(),
  actualHours: z.number().min(0).max(999).optional(),
});

// Task comment
export const taskCommentSchema = z.object({
  taskId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  attachments: z.array(z.string().uuid()).max(5).optional(),
  mentions: z.array(z.string().uuid()).optional(),
});

// Task time log
export const taskTimeLogSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  description: z.string().max(500).optional(),
  billable: z.boolean().default(true),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => {
  const duration = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
  return duration <= 12; // Max 12 hours per entry
}, 'Time entry cannot exceed 12 hours');

// Task filter
export const taskFilterSchema = z.object({
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.array(z.enum(['todo', 'in_progress', 'review', 'completed', 'cancelled'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  includeSubtasks: z.boolean().default(false),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
export type TaskTimeLogInput = z.infer<typeof taskTimeLogSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;