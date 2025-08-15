'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { CreateInvitationDTO } from '@/features/users/types'

const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres email jest wymagany')
    .email('Nieprawidłowy format email'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'COORDINATOR', 'WORKER'], {
    message: 'Rola jest wymagana',
  }),
  message: z.string().optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
})

type InviteUserFormData = z.infer<typeof inviteUserSchema>

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateInvitationDTO) => void
  loading?: boolean
  error?: string | null
}

const roleOptions = [
  { value: 'USER', label: 'Użytkownik - podstawowe uprawnienia' },
  { value: 'WORKER', label: 'Pracownik - wykonawca zadań' },
  { value: 'COORDINATOR', label: 'Koordynator - zarządzanie projektami' },
  { value: 'MODERATOR', label: 'Moderator - zarządzanie zespołem' },
  { value: 'ADMIN', label: 'Administrator - pełne uprawnienia' },
]

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      role: undefined,
      message: '',
      expiresInDays: 7,
    },
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmitForm = (data: InviteUserFormData) => {
    onSubmit(data)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zaproś użytkownika" size="md">
      <motion.form 
        onSubmit={handleSubmit(onSubmitForm)} 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Email Input */}
        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Adres email <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            type="email"
            placeholder="np. jan.kowalski@example.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </motion.div>

        {/* Role Select */}
        <motion.div variants={itemVariants}>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Rola <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <option value="">Wybierz rolę</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </motion.div>

        {/* Message Textarea */}
        <motion.div variants={itemVariants}>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Wiadomość powitalna (opcjonalna)
          </label>
          <textarea
            id="message"
            rows={4}
            placeholder="Dodaj personalną wiadomość powitalną..."
            {...register('message')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            disabled={loading}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </motion.div>

        {/* Expires In Days */}
        <motion.div variants={itemVariants}>
          <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-2">
            Ważność zaproszenia (dni)
          </label>
          <Input
            id="expiresInDays"
            type="number"
            min="1"
            max="365"
            {...register('expiresInDays', { valueAsNumber: true })}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Zaproszenie będzie ważne przez wybraną liczbę dni
          </p>
          {errors.expiresInDays && (
            <p className="mt-1 text-sm text-red-600">{errors.expiresInDays.message}</p>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div 
            className="bg-red-50 border border-red-200 rounded-lg p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Information Box */}
        <motion.div 
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          variants={itemVariants}
        >
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            Jak działa zapraszanie?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>System wygeneruje unikalny kod zaproszenia</li>
            <li>Kod zostanie wysłany na podany adres email</li>
            <li>Użytkownik będzie musiał użyć kodu podczas rejestracji</li>
            <li>Po rejestracji otrzyma automatycznie wybraną rolę</li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex justify-end space-x-4 pt-4 border-t border-gray-200"
          variants={itemVariants}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Wysyłanie...' : 'Wyślij zaproszenie'}
          </Button>
        </motion.div>
      </motion.form>
    </Modal>
  )
}