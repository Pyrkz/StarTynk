'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '../../context/SidebarContext'
import type { CollapsibleSectionProps } from './CollapsibleSection.types'

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  label,
  icon: Icon,
  children,
  defaultExpanded = false,
  className,
}) => {
  const { expandedGroups, toggleGroup } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(
    expandedGroups.includes(id) || defaultExpanded
  )

  useEffect(() => {
    setIsExpanded(expandedGroups.includes(id))
  }, [expandedGroups, id])

  const handleToggle = () => {
    toggleGroup(id)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center w-full px-3 py-2 text-sm font-medium',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          'rounded-lg transition-colors duration-150',
          'group'
        )}
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
      >
        {Icon && (
          <Icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-gray-500" />
        )}
        
        <span className="flex-1 text-left">
          {label}
        </span>
        
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            'group-hover:text-gray-500',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      
      <div
        id={`section-${id}`}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}