import { z } from 'zod'
import { ProjectStatus } from '@repo/database/client-types'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nazwa projektu jest wymagana').max(255),
  address: z.string().min(1, 'Adres jest wymagany').max(500),
  developerId: z.string().min(1, 'Deweloper jest wymagany'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  baseRate: z.coerce
    .number()
    .positive('Stawka bazowa musi być większa od 0')
    .multipleOf(0.01, 'Stawka może mieć maksymalnie 2 miejsca po przecinku'),
  description: z.string().optional(),
  coordinatorId: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  path: ['endDate'],
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
})

export const projectFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.union([z.nativeEnum(ProjectStatus), z.literal('ALL')]).optional(),
  developerId: z.string().optional(),
  coordinatorId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type CreateProjectFormData = z.infer<typeof createProjectSchema>
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>