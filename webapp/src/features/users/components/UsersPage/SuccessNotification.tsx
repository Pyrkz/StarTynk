import React from 'react'
import { Button } from '@/components/ui'
import { CheckCircle, X } from 'lucide-react'

interface SuccessNotificationProps {
  message: string
  onClose: () => void
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md animate-slide-up z-50">
      <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
        <div className="p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-neutral-900">
                Zaproszenie wysłane!
              </h3>
              <p className="mt-1 text-sm text-neutral-600">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-white text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Zamknij</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessNotification