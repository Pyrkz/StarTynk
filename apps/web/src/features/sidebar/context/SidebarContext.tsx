'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { SidebarContextValue, SidebarState } from '../types'
import { saveSidebarState, loadSidebarState } from '../lib/utils'
import { SIDEBAR_CONSTANTS } from '../lib/constants'

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
  persistState?: boolean
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultCollapsed = false,
  persistState = true,
}) => {
  const pathname = usePathname()
  
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<SidebarState>(() => {
    const saved = persistState ? loadSidebarState() : {}
    return {
      isCollapsed: saved.isCollapsed ?? defaultCollapsed,
      expandedGroups: saved.expandedGroups ?? [],
      activeItemId: saved.activeItemId ?? null,
      recentItems: saved.recentItems ?? [],
    }
  })

  // Update active item based on pathname
  useEffect(() => {
    // This will be updated by the Sidebar component based on current route
  }, [pathname])

  // Save state to localStorage when it changes
  useEffect(() => {
    if (persistState) {
      saveSidebarState(state)
    }
  }, [state, persistState])

  const toggleCollapsed = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))
  }, [])

  const setCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, isCollapsed: collapsed }))
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      expandedGroups: prev.expandedGroups.includes(groupId)
        ? prev.expandedGroups.filter(id => id !== groupId)
        : [...prev.expandedGroups, groupId],
    }))
  }, [])

  const setActiveItem = useCallback((itemId: string | null) => {
    setState(prev => ({ ...prev, activeItemId: itemId }))
  }, [])


  const addRecentItem = useCallback((itemId: string) => {
    setState(prev => {
      const newRecentItems = [
        itemId,
        ...prev.recentItems.filter(id => id !== itemId),
      ].slice(0, SIDEBAR_CONSTANTS.LIMITS.MAX_RECENT_ITEMS)
      
      return { ...prev, recentItems: newRecentItems }
    })
  }, [])

  const clearRecentItems = useCallback(() => {
    setState(prev => ({ ...prev, recentItems: [] }))
  }, [])

  const value: SidebarContextValue = {
    ...state,
    toggleCollapsed,
    setCollapsed,
    toggleGroup,
    setActiveItem,
    addRecentItem,
    clearRecentItems,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}