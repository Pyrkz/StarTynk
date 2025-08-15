'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarInner } from '@/features/sidebar/components/Sidebar/Sidebar'
import { SidebarProvider, useSidebar } from '@/features/sidebar'
import { Header, HeaderProvider } from '@/features/header'
import { cn } from '@/lib/utils'
import type { DashboardLayoutProps } from './DashboardLayout.types'

// Separate component to use the sidebar context
const DashboardContent: React.FC<DashboardLayoutProps> = ({
  children,
  showSearch = false,
  pageTitle,
  breadcrumbs,
  notificationCount
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toggleCollapsed } = useSidebar()

  // Check if we're on mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const handleSidebarToggle = useCallback(() => {
    // On mobile, close the menu when collapsing
    if (isMobile) {
      setIsMobileMenuOpen(false)
    } else {
      // On desktop, just toggle the collapsed state
      toggleCollapsed()
    }
  }, [toggleCollapsed, isMobile])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - hidden on mobile by default */}
      <motion.div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto',
          'lg:block' // Always show on desktop
        )}
        initial={false}
        animate={{
          x: isMobile ? (isMobileMenuOpen ? 0 : -256) : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
      >
        <SidebarInner onToggleOverride={handleSidebarToggle} />
      </motion.div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with controlled mobile menu state */}
        <HeaderProvider>
          <Header
            onMenuToggle={handleMenuToggle}
            showSearch={showSearch}
            title={pageTitle}
            breadcrumbs={breadcrumbs}
            isMobileMenuOpen={isMobileMenuOpen}
          />
        </HeaderProvider>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-4 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Main component wrapper with SidebarProvider
export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  return (
    <SidebarProvider>
      <DashboardContent {...props} />
    </SidebarProvider>
  )
}