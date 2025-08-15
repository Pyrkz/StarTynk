'use client'

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SidebarProvider, useSidebar } from '../../context/SidebarContext'
import { SidebarHeader } from '../SidebarHeader'
import { SidebarFooter } from '../SidebarFooter'
import { NavigationItem } from '../NavigationItem'
import { useNavigation } from '../../hooks/useNavigation'
import { SIDEBAR_STYLES } from '../../lib/constants'
import type { SidebarProps } from './Sidebar.types'
import type { NavigationItem as NavigationItemType } from '../../types'

// Komponent wewnętrzny używający kontekstu
export const SidebarInner: React.FC<SidebarProps> = ({
  logoSrc,
  logoAlt,
  title,
  version,
  className,
  onToggleOverride,
}) => {
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const {
    navigation,
    isExpanded,
    isActive,
    isActiveParent,
    toggleExpanded,
  } = useNavigation()

  // Grupuj elementy nawigacji
  const topNavItems = navigation.filter(item => item.position !== 'bottom')
  const bottomNavItems = navigation.filter(item => item.position === 'bottom')

  const renderNavigationItem = useCallback((item: NavigationItemType, level = 0) => {
    // W trybie collapsed nie renderuj sub-items
    if (isCollapsed && level > 0) {
      return null
    }

    // Jeśli element ma dzieci, renderuj je bezpośrednio
    if (item.children && item.children.length > 0) {
      const isItemExpanded = isExpanded(item.id)
      const isParentActive = isActiveParent(item)
      
      return (
        <div key={item.id}>
          <NavigationItem
            item={item}
            isActive={isParentActive}
            isCollapsed={isCollapsed}
            level={level}
            isExpanded={isItemExpanded}
            onToggleExpand={() => toggleExpanded(item.id)}
            hasChildren={true}
          />
          <AnimatePresence>
            {isItemExpanded && !isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <motion.div 
                  className="ml-2 mt-1 space-y-0.5 pl-4 relative"
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neutral-200/20 via-neutral-200/50 to-neutral-200/20 rounded-full" />
                  {item.children.map((child, index) => (
                    <motion.div
                      key={child.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {renderNavigationItem(child, level + 1)}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    // Renderuj jako zwykły element nawigacji
    return (
      <NavigationItem
        key={item.id}
        item={item}
        isActive={isActive(item)}
        isCollapsed={isCollapsed}
        level={level}
      />
    )
  }, [isCollapsed, isExpanded, isActive, isActiveParent, toggleExpanded])

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? 64 : 256,
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className={cn(
        'flex flex-col h-full relative',
        SIDEBAR_STYLES.backdrop,
        className
      )}
    >
      {/* Subtle glow effect */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary-50/20 to-transparent opacity-50" />
      </motion.div>

      {/* Nagłówek */}
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={onToggleOverride || toggleCollapsed}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        title={title}
      />

      {/* Główna nawigacja */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
        <div className="flex flex-col h-full">
          {/* Górne elementy nawigacji */}
          <motion.div 
            className="flex-1 px-3 py-4 space-y-1"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {topNavItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { x: -20, opacity: 0 },
                  visible: { x: 0, opacity: 1 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                {renderNavigationItem(item)}
              </motion.div>
            ))}
          </motion.div>

          {/* Dolne elementy nawigacji */}
          {bottomNavItems.length > 0 && (
            <motion.div 
              className="px-3 py-4 mt-auto border-t border-neutral-200/50 space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.3
                  }
                }
              }}
            >
              {bottomNavItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { x: -20, opacity: 0 },
                    visible: { x: 0, opacity: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  {renderNavigationItem(item)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Stopka */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        version={version}
      />
    </motion.aside>
  )
}

// Główny komponent z providerem
export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <SidebarProvider defaultCollapsed={props.defaultCollapsed}>
      <SidebarInner {...props} />
    </SidebarProvider>
  )
}