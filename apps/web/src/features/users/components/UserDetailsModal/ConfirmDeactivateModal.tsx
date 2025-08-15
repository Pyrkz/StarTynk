'use client'

import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'
import { UserWithRelations } from '@/features/users/types'

interface ConfirmDeactivateModalProps {
  user: UserWithRelations | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export const ConfirmDeactivateModal: React.FC<ConfirmDeactivateModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!user) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-neutral-900">
                      Dezaktywuj użytkownika
                    </Dialog.Title>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-neutral-600">
                    Czy na pewno chcesz dezaktywować użytkownika <strong>{user.name || user.email}</strong>?
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Użytkownik straci dostęp do systemu, ale jego dane i historia pozostaną zachowane. 
                    Możesz ponownie aktywować tego użytkownika w przyszłości.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onConfirm}
                    disabled={loading}
                    isLoading={loading}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white border-red-600"
                  >
                    Tak, dezaktywuj użytkownika
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}