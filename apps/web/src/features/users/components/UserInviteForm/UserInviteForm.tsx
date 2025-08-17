'use client'

import React, { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { CreateInvitationDTO } from '@/features/users/types'
import { Role } from '@repo/database/client-types'

interface UserInviteFormProps {
  onSubmit: (data: CreateInvitationDTO) => Promise<void>
  loading?: boolean
}

const roleOptions: { value: Role; label: string }[] = [
  { value: 'USER', label: 'Użytkownik' },
  { value: 'WORKER', label: 'Pracownik' },
  { value: 'COORDINATOR', label: 'Koordynator' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Administrator' },
]

export const UserInviteForm: React.FC<UserInviteFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<CreateInvitationDTO>({
    email: '',
    role: 'USER',
    message: '',
    expiresInDays: 7,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateInvitationDTO, string>>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'expiresInDays' ? parseInt(value) || 7 : value,
    }))
    // Clear error when user starts typing
    if (errors[name as keyof CreateInvitationDTO]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateInvitationDTO, string>> = {}

    if (!formData.email) {
      newErrors.email = 'Email jest wymagany'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email'
    }

    if (!formData.role) {
      newErrors.role = 'Rola jest wymagana'
    }

    if (formData.expiresInDays && (formData.expiresInDays < 1 || formData.expiresInDays > 30)) {
      newErrors.expiresInDays = 'Ważność musi być między 1 a 30 dni'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        email: '',
        role: 'USER',
        message: '',
        expiresInDays: 7,
      })
    } catch {
      // Error handling is done in parent component
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Adres email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jan.kowalski@example.com"
          error={errors.email}
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Rola
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={loading}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-1">
          Ważność zaproszenia (dni)
        </label>
        <Input
          id="expiresInDays"
          name="expiresInDays"
          type="number"
          value={formData.expiresInDays}
          onChange={handleChange}
          min="1"
          max="30"
          error={errors.expiresInDays}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Wiadomość powitalna (opcjonalna)
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Witaj w naszym zespole! Cieszymy się, że do nas dołączasz..."
          disabled={loading}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Wysyłanie...' : 'Wyślij zaproszenie'}
        </Button>
      </div>
    </form>
  )
}