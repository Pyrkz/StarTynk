'use client'

import React from 'react'
import Link from 'next/link'
import { CreateProjectForm } from '@/features/projekty/components'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, FileText } from 'lucide-react'

export default function AddProjectPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/projekty">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Powrót do listy projektów
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Nowy projekt</h1>
            <p className="text-sm text-neutral-600">Wypełnij formularz, aby utworzyć nowy projekt</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-elevation-low p-6 md:p-8">
        <CreateProjectForm />
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Wskazówki:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Nazwa projektu powinna być unikalna i łatwa do identyfikacji</li>
          <li>• Adres powinien zawierać pełną lokalizację inwestycji</li>
          <li>• Koordynator może zostać przypisany później</li>
        </ul>
      </div>
    </div>
  )
}