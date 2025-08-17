'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '@/components/ui'
import { UserWithRelations } from '@/features/users/types'
import { Role } from '@repo/database/client-types'

const editUserSchema = z.object({
  name: z.string().min(2, 'Nazwa musi mieć minimum 2 znaki').optional().or(z.literal('')),
  email: z.string().email('Nieprawidłowy adres email'),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  role: z.nativeEnum(Role),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserFormProps {
  user: UserWithRelations
  onSubmit: (data: EditUserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const roleOptions: { value: Role; label: string }[] = [
  { value: 'USER', label: 'Użytkownik' },
  { value: 'WORKER', label: 'Pracownik' },
  { value: 'COORDINATOR', label: 'Koordynator' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Administrator' },
]

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      position: user.position || '',
      department: user.department || '',
      role: user.role,
    },
  })

  const onFormSubmit = async (data: EditUserFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            Imię i nazwisko
          </label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            disabled={loading || isSubmitting}
            placeholder="Jan Kowalski"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            disabled={loading || isSubmitting}
            placeholder="jan.kowalski@firma.pl"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
            Telefon
          </label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            disabled={loading || isSubmitting}
            placeholder="+48 123 456 789"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-neutral-700 mb-1">
            Stanowisko
          </label>
          <Input
            id="position"
            type="text"
            {...register('position')}
            error={errors.position?.message}
            disabled={loading || isSubmitting}
            placeholder="Kierownik sprzedaży"
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1">
            Dział
          </label>
          <Input
            id="department"
            type="text"
            {...register('department')}
            error={errors.department?.message}
            disabled={loading || isSubmitting}
            placeholder="Sprzedaż"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
            Rola <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            {...register('role')}
            className="block w-full pl-3 pr-10 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
            disabled={loading || isSubmitting}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading || isSubmitting}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          disabled={loading || isSubmitting}
          isLoading={isSubmitting}
        >
          Zapisz zmiany
        </Button>
      </div>
    </form>
  )
}