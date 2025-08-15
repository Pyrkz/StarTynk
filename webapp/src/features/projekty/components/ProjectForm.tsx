'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useDevelopers, useCoordinators } from '../hooks'
import { createProjectSchema, CreateProjectFormData } from '../utils/validation'
import { Calendar, MapPin, DollarSign, User, Building2, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectFormProps {
  onSuccess?: () => void
  className?: string
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSuccess, className }) => {
  const router = useRouter()
  const { developers, loading: developersLoading } = useDevelopers()
  const { coordinators, loading: coordinatorsLoading } = useCoordinators()
  
  const [formData, setFormData] = useState<CreateProjectFormData>({
    name: '',
    address: '',
    developerId: '',
    startDate: new Date(),
    endDate: new Date(),
    baseRate: 0,
    description: '',
    coordinatorId: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'baseRate' ? parseFloat(value) || 0 : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitError(null)

    // Validate form data
    const validation = createProjectSchema.safeParse(formData)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd tworzenia projektu')
      }

      // Success
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/projekty')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateForInput = (date: Date) => {
    const d = new Date(date)
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const day = `${d.getDate()}`.padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="md:col-span-2">
          <Input
            name="name"
            label="Nazwa projektu"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="np. Osiedle Słoneczne"
            required
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Input
            name="address"
            label="Adres"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            icon={<MapPin className="w-4 h-4" />}
            placeholder="np. ul. Przykładowa 123, 00-000 Warszawa"
            required
          />
        </div>

        {/* Developer */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Deweloper
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              name="developerId"
              value={formData.developerId}
              onChange={handleChange}
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200",
                "bg-white text-gray-900",
                "hover:border-gray-400",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                "focus:outline-none",
                errors.developerId && "border-error-500 focus:ring-error-500"
              )}
              required
              disabled={developersLoading}
            >
              <option value="">Wybierz dewelopera</option>
              {developers.map((developer) => (
                <option key={developer.id} value={developer.id}>
                  {developer.name}
                </option>
              ))}
            </select>
          </div>
          {errors.developerId && (
            <p className="mt-2 text-sm text-error-600">{errors.developerId}</p>
          )}
        </div>

        {/* Coordinator */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Koordynator (opcjonalnie)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              name="coordinatorId"
              value={formData.coordinatorId}
              onChange={handleChange}
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200",
                "bg-white text-gray-900",
                "hover:border-gray-400",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                "focus:outline-none"
              )}
              disabled={coordinatorsLoading}
            >
              <option value="">Bez koordynatora</option>
              {coordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>
                  {coordinator.name || coordinator.email} ({coordinator.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <Input
            type="date"
            name="startDate"
            label="Data rozpoczęcia"
            value={formatDateForInput(formData.startDate)}
            onChange={handleChange}
            error={errors.startDate}
            icon={<Calendar className="w-4 h-4" />}
            required
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            type="date"
            name="endDate"
            label="Data zakończenia"
            value={formatDateForInput(formData.endDate)}
            onChange={handleChange}
            error={errors.endDate}
            icon={<Calendar className="w-4 h-4" />}
            required
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Opis (opcjonalnie)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200",
                "bg-white text-gray-900",
                "placeholder:text-gray-400",
                "hover:border-gray-400",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                "focus:outline-none",
                "min-h-[100px]"
              )}
              placeholder="Dodatkowe informacje o projekcie..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/projekty')}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Utwórz projekt
        </Button>
      </div>
    </form>
  )
}

export { ProjectForm }