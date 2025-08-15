'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/features/dashboard'

export default function HeaderDemoPage() {
  const [notificationCount, setNotificationCount] = useState(5)
  const [showSearch, setShowSearch] = useState(true)

  // Example breadcrumbs
  const breadcrumbs = [
    { label: 'Komponenty', href: '/dashboard/components' },
    { label: 'Header Demo' }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Header Component Demo
          </h2>
          
          <p className="text-gray-600 mb-6">
            Ten przykład pokazuje różne konfiguracje komponentu Header.
          </p>

          <div className="space-y-4">
            {/* Notification controls */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Liczba powiadomień:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotificationCount(Math.max(0, notificationCount - 1))}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm font-medium">{notificationCount}</span>
                <button
                  onClick={() => setNotificationCount(notificationCount + 1)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Search toggle */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Pokaż wyszukiwarkę:
              </label>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showSearch ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showSearch ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Funkcje Header:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Przycisk menu mobilnego (widoczny na małych ekranach)</li>
              <li>• Breadcrumbs lub tytuł strony</li>
              <li>• Opcjonalna wyszukiwarka (można włączyć/wyłączyć)</li>
              <li>• Ikona powiadomień z licznikiem</li>
              <li>• Menu użytkownika z avatarem i opcjami</li>
              <li>• Sticky positioning z efektem blur przy przewijaniu</li>
              <li>• Pełna responsywność</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}