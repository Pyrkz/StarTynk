'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '../../context/SidebarContext'
import { SidebarTooltip } from '../SidebarTooltip'
import { NavigationSubItem } from './NavigationSubItem'
import { NAVIGATION_VARIANTS } from '../../lib/constants'
import type { NavigationItemProps } from './NavigationItem.types'

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  level = 0,
  isActive = false,
  isCollapsed = false,
  showTooltip = true,
  onNavigate,
  isExpanded: controlledExpanded,
  onToggleExpand,
  hasChildren: hasChildrenProp,
}) => {
  const { addRecentItem } = useSidebar()
  const [localExpanded, setLocalExpanded] = useState(false)
  
  // Use controlled state if provided, otherwise use local state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded
  const setIsExpanded = onToggleExpand || ((value: boolean) => setLocalExpanded(value))
  
  const hasChildren = hasChildrenProp !== undefined ? hasChildrenProp : (item.children && item.children.length > 0)
  const Icon = item.icon

  const handleClick = () => {
    // W trybie collapsed, jeśli element ma href, zawsze nawiguj
    if (isCollapsed && item.href) {
      addRecentItem(item.id)
      if (onNavigate && !item.disabled) {
        onNavigate(item)
      }
      item.onClick?.()
      return
    }
    
    // W trybie rozszerzonym, zachowaj poprzednią logikę
    if (hasChildren) {
      if (onToggleExpand) {
        onToggleExpand()
      } else {
        setIsExpanded(!isExpanded)
      }
    } else {
      if (item.href) {
        addRecentItem(item.id)
      }
      if (onNavigate && !item.disabled) {
        onNavigate(item)
      }
      item.onClick?.()
    }
  }


  const content = (
    <>
      {Icon && (
        <motion.div 
          className={cn(
            'relative flex items-center justify-center',
            'w-8 h-8',
            'rounded-lg',
            isActive ? 'bg-primary-100/50 shadow-sm' : ''
          )}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon 
            className={cn(
              'flex-shrink-0',
              'h-4 w-4',
              isActive ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-700'
            )}
          />
        </motion.div>
      )}
      
      <div className={cn(
        "flex-1 flex items-center overflow-hidden transition-all duration-300",
        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
      )}>
        <span className={cn(
          "text-left truncate ml-2.5 text-sm",
          isActive ? "font-semibold text-neutral-900" : "font-medium text-neutral-700 group-hover:text-neutral-900"
        )}>
          {item.label}
        </span>
      </div>
      
      {!isCollapsed && (
        <>
          {item.shortcut && !hasChildren && (
            <kbd className="ml-auto text-[10px] text-neutral-500 bg-neutral-100/50 px-1.5 py-0.5 rounded-md font-mono border border-neutral-200/50 shadow-sm transition-opacity duration-300">
              {item.shortcut}
            </kbd>
          )}
          
          {item.badge && !hasChildren && (
            <span
              className={cn(
                'ml-2 inline-flex items-center justify-center',
                'px-2.5 py-1 text-xs font-semibold rounded-full',
                NAVIGATION_VARIANTS.badge[item.badge.variant || 'default'],
                item.badge.pulse && 'animate-pulse',
                'shadow-sm transition-all duration-300'
              )}
            >
              {item.badge.content}
            </span>
          )}
          
          {hasChildren && !isCollapsed && (
            <motion.div 
              className={cn(
                'ml-auto p-1 rounded-md',
                'group-hover:bg-neutral-100/50'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
              >
                <ChevronDown
                  className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600"
                />
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </>
  )

  const className = cn(
    'group relative flex items-center w-full rounded-lg transition-all duration-200',
    level === 0 && !isCollapsed ? 'hover:translate-x-0.5' : '',
    level === 0 ? 'px-2.5 py-1.5' : 'px-2.5 py-1',
    item.disabled
      ? NAVIGATION_VARIANTS.item.disabled
      : isActive
      ? level === 0 ? NAVIGATION_VARIANTS.item.active : NAVIGATION_VARIANTS.item.subitem.active
      : level === 0 ? NAVIGATION_VARIANTS.item.default : NAVIGATION_VARIANTS.item.subitem.default
  )

  const element = item.href && !hasChildren && !item.disabled ? (
    <Link
      href={item.href}
      onClick={handleClick}
      className={className}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
    >
      {content}
    </Link>
  ) : (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      className={className}
    >
      {content}
    </button>
  )

  return isCollapsed && showTooltip && level === 0 ? (
    <SidebarTooltip content={item.label}>
      {element}
    </SidebarTooltip>
  ) : (
    element
  )
}