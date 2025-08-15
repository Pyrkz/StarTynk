'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SIDEBAR_STYLES } from '../../lib/constants'
import type { SidebarHeaderProps } from './SidebarHeader.types'

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggle,
  logoSrc,
  logoAlt = 'Logo',
  title = 'StarTynk',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex items-center h-16 px-3',
        SIDEBAR_STYLES.header.base,
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center flex-1">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span 
              className="text-lg font-bold text-neutral-900 tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className={cn(
          'p-2 rounded-lg',
          'hover:bg-neutral-100/80 focus:outline-none focus:ring-2',
          'focus:ring-primary-500/20 hover:shadow-sm',
          'group'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
      >
        <motion.div 
          className="relative w-5 h-5"
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight 
                  className="h-5 w-5 text-neutral-500 group-hover:text-neutral-700"
                />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft
                  className="h-5 w-5 text-neutral-500 group-hover:text-neutral-700"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>
    </div>
  )
}