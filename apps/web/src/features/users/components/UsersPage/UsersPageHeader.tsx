import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { Plus } from 'lucide-react'

interface UsersPageHeaderProps {
  onInviteClick: () => void
}

const UsersPageHeader: React.FC<UsersPageHeaderProps> = ({ onInviteClick }) => {
  return (
    <div className="sticky top-0 z-10 bg-gray-50 py-4 sm:py-6 lg:py-8 border-b border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-neutral-900">
            Użytkownicy
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-neutral-600">
            Zarządzaj użytkownikami i ich uprawnieniami w systemie
          </p>
        </div>
        <motion.div 
          className="flex"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={onInviteClick}
              className="inline-flex items-center w-full sm:w-auto justify-center"
            >
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </motion.div>
              <span className="text-sm sm:text-base">Zaproś użytkownika</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default UsersPageHeader