import { SIDEBAR_CONSTANTS } from './constants'
import type { NavigationItem, NavigationGroup, SidebarState } from '../types'
import type { Role } from '@repo/database'
import { storage } from '@repo/shared/storage'

/**
 * Check if user has required role for navigation item
 */
export function hasRequiredRole(
  userRole: Role | undefined,
  requiredRoles?: Role[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(
  items: NavigationItem[],
  userRole: Role | undefined
): NavigationItem[] {
  return items
    .filter(item => hasRequiredRole(userRole, item.requiredRoles))
    .map(item => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, userRole)
        : undefined,
    }))
}

/**
 * Filter navigation groups based on user role
 */
export function filterGroupsByRole(
  groups: NavigationGroup[],
  userRole: Role | undefined
): NavigationGroup[] {
  return groups
    .filter(group => hasRequiredRole(userRole, group.requiredRoles))
    .map(group => ({
      ...group,
      items: filterNavigationByRole(group.items, userRole),
    }))
    .filter(group => group.items.length > 0)
}

/**
 * Find navigation item by ID
 */
export function findNavigationItem(
  items: NavigationItem[],
  itemId: string
): NavigationItem | null {
  for (const item of items) {
    if (item.id === itemId) return item
    if (item.children) {
      const found = findNavigationItem(item.children, itemId)
      if (found) return found
    }
  }
  return null
}

/**
 * Get all parent IDs for a navigation item
 */
export function getParentIds(
  items: NavigationItem[],
  itemId: string,
  parents: string[] = []
): string[] {
  for (const item of items) {
    if (item.id === itemId) return parents
    if (item.children) {
      const found = getParentIds(item.children, itemId, [...parents, item.id])
      if (found.length > parents.length) return found
    }
  }
  return parents
}

/**
 * Check if navigation item is active
 */
export function isItemActive(
  item: NavigationItem,
  pathname: string
): boolean {
  if (!item.href) return false
  
  // Exact match
  if (item.href === pathname) return true
  
  // Partial match for nested routes
  if (pathname.startsWith(item.href + '/')) return true
  
  return false
}

/**
 * Save sidebar state to unified storage
 */
export async function saveSidebarState(state: Partial<SidebarState>): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    const currentState = await loadSidebarState()
    const newState = { ...currentState, ...state }
    await storage.setObject(SIDEBAR_CONSTANTS.STORAGE.STATE_KEY, newState)
  } catch (error) {
    console.error('Failed to save sidebar state:', error)
  }
}

/**
 * Load sidebar state from unified storage
 */
export async function loadSidebarState(): Promise<Partial<SidebarState>> {
  if (typeof window === 'undefined') return {}
  
  try {
    const state = await storage.getObject<Partial<SidebarState>>(SIDEBAR_CONSTANTS.STORAGE.STATE_KEY)
    return state || {}
  } catch (error) {
    console.error('Failed to load sidebar state:', error)
    return {}
  }
}

/**
 * Generate breadcrumbs from navigation structure
 */
export function generateBreadcrumbs(
  groups: NavigationGroup[],
  pathname: string
): Array<{ label: string; href?: string }> {
  const breadcrumbs: Array<{ label: string; href?: string }> = []
  
  for (const group of groups) {
    for (const item of group.items) {
      if (isItemActive(item, pathname)) {
        if (group.label) {
          breadcrumbs.push({ label: group.label })
        }
        breadcrumbs.push({ label: item.label, href: item.href })
        return breadcrumbs
      }
      
      if (item.children) {
        const childBreadcrumbs = findChildBreadcrumbs(item, pathname)
        if (childBreadcrumbs.length > 0) {
          if (group.label) {
            breadcrumbs.push({ label: group.label })
          }
          breadcrumbs.push({ label: item.label, href: item.href })
          breadcrumbs.push(...childBreadcrumbs)
          return breadcrumbs
        }
      }
    }
  }
  
  return breadcrumbs
}

function findChildBreadcrumbs(
  parent: NavigationItem,
  pathname: string
): Array<{ label: string; href?: string }> {
  if (!parent.children) return []
  
  for (const child of parent.children) {
    if (isItemActive(child, pathname)) {
      return [{ label: child.label, href: child.href }]
    }
    
    if (child.children) {
      const grandchildBreadcrumbs = findChildBreadcrumbs(child, pathname)
      if (grandchildBreadcrumbs.length > 0) {
        return [
          { label: child.label, href: child.href },
          ...grandchildBreadcrumbs,
        ]
      }
    }
  }
  
  return []
}