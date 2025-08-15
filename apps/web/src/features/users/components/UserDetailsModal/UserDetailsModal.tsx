'use client'

import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Button } from '@/components/ui'
import { UserWithRelations } from '@/features/users/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { UserAvatar } from '../UserTable/UserAvatar'
import { EditUserForm } from './EditUserForm'
import { ConfirmDeactivateModal } from './ConfirmDeactivateModal'

interface UserDetailsModalProps {
  user: UserWithRelations | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: string, data: any) => Promise<void>
  onDelete: (user: UserWithRelations) => Promise<void>
  loading?: boolean
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  MODERATOR: 'Moderator',
  COORDINATOR: 'Koordynator',
  WORKER: 'Pracownik',
  USER: 'Użytkownik',
}

const roleBadgeClasses: Record<string, string> = {
  ADMIN: 'badge-error',
  MODERATOR: 'badge-blue',
  COORDINATOR: 'badge-success',
  WORKER: 'badge-warning',
  USER: 'badge-neutral',
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false)

  if (!user) return null

  const handleUpdate = async (data: any) => {
    await onUpdate(user.id, data)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(user)
    setIsDeleting(false)
    setShowConfirmDeactivate(false)
    onClose()
  }

  return (
    <>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-neutral-900">
                    {isEditing ? 'Edytuj użytkownika' : 'Szczegóły użytkownika'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <LayoutGroup>
                  <motion.div
                    layout
                    animate={{ height: "auto" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isEditing ? (
                        <motion.div
                          key="edit-form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <EditUserForm
                            user={user}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            loading={loading}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="user-details"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                    {/* User Header */}
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-neutral-200">
                      <UserAvatar user={user} size="lg" />
                      <div className="flex-1">
                        <h4 className="text-xl font-medium text-neutral-900">
                          {user.name || 'Brak nazwy'}
                        </h4>
                        <p className="text-sm text-neutral-600">{user.email}</p>
                        {user.position && (
                          <p className="text-sm text-neutral-500">{user.position}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleBadgeClasses[user.role] || 'badge-neutral'}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h5 className="text-sm font-medium text-neutral-700 mb-3">Informacje kontaktowe</h5>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-neutral-500">Email:</span>
                            <p className="text-sm font-medium text-neutral-900">{user.email}</p>
                          </div>
                          <div>
                            <span className="text-sm text-neutral-500">Telefon:</span>
                            <p className="text-sm font-medium text-neutral-900">{user.phone || '—'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-neutral-500">Dział:</span>
                            <p className="text-sm font-medium text-neutral-900">{user.department || '—'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-neutral-700 mb-3">Informacje systemowe</h5>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-neutral-500">Data utworzenia:</span>
                            <p className="text-sm font-medium text-neutral-900">{formatDate(user.createdAt)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-neutral-500">Ostatnia aktualizacja:</span>
                            <p className="text-sm font-medium text-neutral-900">{formatDate(user.updatedAt)}</p>
                          </div>
                          {user.lastLoginAt && (
                            <div>
                              <span className="text-sm text-neutral-500">Ostatnie logowanie:</span>
                              <p className="text-sm font-medium text-neutral-900">
                                {formatDate(user.lastLoginAt)}
                                <span className="text-xs text-neutral-500 ml-1">
                                  ({formatDateTime(user.lastLoginAt)})
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    {user._count && (
                      <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                        <h5 className="text-sm font-medium text-neutral-700 mb-2">Statystyki</h5>
                        <div className="flex items-center space-x-6">
                          <div>
                            <span className="text-2xl font-semibold text-neutral-900">
                              {user._count.taskAssignments || 0}
                            </span>
                            <p className="text-sm text-neutral-600">Przypisanych zadań</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                      {user.isActive && (
                        <button
                          onClick={() => setShowConfirmDeactivate(true)}
                          disabled={loading || isDeleting}
                          className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-150"
                        >
                          Dezaktywuj użytkownika
                        </button>
                      )}
                      <Button
                        onClick={() => setIsEditing(true)}
                        disabled={loading}
                        className="ml-auto"
                      >
                        Edytuj dane
                      </Button>
                    </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </LayoutGroup>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
      
    <ConfirmDeactivateModal
      user={user}
      isOpen={showConfirmDeactivate}
      onClose={() => setShowConfirmDeactivate(false)}
      onConfirm={handleDelete}
      loading={isDeleting}
    />
    </>
  )
}