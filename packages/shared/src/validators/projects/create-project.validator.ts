import { z } from 'zod';

export const CreateProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  categoryId: z.string().cuid('Invalid category ID'),
  budget: z
    .number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget must not exceed 1,000,000'),
  location: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  timeline: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
  status: z
    .enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  requirements: z.array(z.string()).optional().default([]),
  images: z.array(z.string().url('Invalid image URL')).optional().default([]),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;