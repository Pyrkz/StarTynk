import { z } from 'zod';

export const UpdateProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  budget: z
    .number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget must not exceed 1,000,000')
    .optional(),
  location: z
    .object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  timeline: z
    .object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    })
    .optional(),
  status: z
    .enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  requirements: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;