'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NavigationItem } from '../NavigationItem'
import { CollapsibleSection } from '../CollapsibleSection'
import { isItemActive } from '../../lib/utils'
import type { NavigationGroupProps } from './NavigationGroup.types'

export const NavigationGroup: React.FC<NavigationGroupProps> = ({
  group,
  isCollapsed = false,
  onNavigate,
}) => {
  const pathname = usePathname()
  const GroupIcon = group.icon

  // Check if any item in the group is active
  const hasActiveItem = group.items.some(item => 
    isItemActive(item, pathname) ||
    (item.children?.some(child => isItemActive(child, pathname)) ?? false)
  )

  const content = (
    <div className="space-y-0.5">
      {group.items.map((item) => {
        const isActive = isItemActive(item, pathname) ||
          (item.children?.some(child => isItemActive(child, pathname)) ?? false)
        
        return (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        )
      })}
    </div>
  )

  // If group has a label and is collapsible
  if (group.label && group.collapsible && !isCollapsed) {
    return (
      <CollapsibleSection
        id={group.id}
        label={group.label}
        icon={GroupIcon}
        defaultExpanded={group.defaultExpanded ?? hasActiveItem}
      >
        {content}
      </CollapsibleSection>
    )
  }

  // If collapsed, show only icon (if provided)
  if (isCollapsed && GroupIcon && group.label) {
    return (
      <div className="px-3 py-2">
        <div className="flex justify-center">
          <GroupIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-2 space-y-0.5">
          {content}
        </div>
      </div>
    )
  }

  // Simple group with optional label
  return (
    <div>
      {group.label && !isCollapsed && (
        <div className="flex items-center px-3 py-2">
          {GroupIcon && (
            <GroupIcon className="h-4 w-4 text-gray-400 mr-2" />
          )}
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {group.label}
          </h3>
        </div>
      )}
      {content}
    </div>
  )
}