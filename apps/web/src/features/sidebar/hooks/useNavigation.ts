'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { NavigationItem, UserRole } from '../types'
import { 
  navigationConfig, 
  filterNavigationByRole, 
  findActiveItem,
  hasActiveChild 
} from '../components/Sidebar/navigation.config'
import { storage } from '@repo/shared/storage'

export function useNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [activeItem, setActiveItem] = useState<NavigationItem | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Filtruj nawigację na podstawie roli użytkownika
  useEffect(() => {
    const userRole = (session?.user?.role || 'USER') as UserRole
    const filteredNav = filterNavigationByRole(navigationConfig, userRole)
    setNavigation(filteredNav)
  }, [session])

  // Znajdź aktywny element
  useEffect(() => {
    const active = findActiveItem(navigation, pathname)
    setActiveItem(active)
    
    // Automatycznie rozwiń rodziców aktywnego elementu
    if (active) {
      const newExpanded = new Set(expandedItems)
      let current = navigation
      
      // Znajdź wszystkich rodziców aktywnego elementu
      const findParents = (items: NavigationItem[], target: NavigationItem): string[] => {
        for (const item of items) {
          if (item.children) {
            if (item.children.some(child => child.id === target.id)) {
              return [item.id]
            }
            const childResult = findParents(item.children, target)
            if (childResult.length > 0) {
              return [item.id, ...childResult]
            }
          }
        }
        return []
      }
      
      const parents = findParents(navigation, active)
      parents.forEach(id => newExpanded.add(id))
      setExpandedItems(newExpanded)
    }
  }, [pathname, navigation])

  // Załaduj zapisany stan z unified storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadExpandedItems = async () => {
      try {
        const savedExpanded = await storage.getObject<string[]>('sidebar-expanded')
        if (savedExpanded) {
          setExpandedItems(new Set(savedExpanded))
        }
      } catch (error) {
        console.error('Failed to load sidebar expanded state:', error)
      }
    }
    
    loadExpandedItems()
  }, [])

  // Zapisz stan do unified storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saveExpandedItems = async () => {
      try {
        await storage.setObject('sidebar-expanded', Array.from(expandedItems))
      } catch (error) {
        console.error('Failed to save sidebar expanded state:', error)
      }
    }
    
    saveExpandedItems()
  }, [expandedItems])


  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])


  const isExpanded = useCallback((itemId: string) => {
    return expandedItems.has(itemId)
  }, [expandedItems])


  const isActive = useCallback((item: NavigationItem) => {
    return item.href === pathname
  }, [pathname])

  const isActiveParent = useCallback((item: NavigationItem) => {
    return hasActiveChild(item, pathname)
  }, [pathname])

  return {
    navigation,
    activeItem,
    isExpanded,
    isActive,
    isActiveParent,
    toggleExpanded,
  }
}