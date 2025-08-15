'use client'

import React from 'react'
import { HelpCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarTooltip } from '../SidebarTooltip'
import { SIDEBAR_STYLES } from '../../lib/constants'
import type { SidebarFooterProps } from './SidebarFooter.types'

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isCollapsed,
  version = '1.0.0',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex items-center gap-2 px-3 py-3',
        SIDEBAR_STYLES.footer.base,
        isCollapsed && 'justify-center',
        className
      )}
    >
      <SidebarTooltip content="Pomoc" side="right">
        <button
          className={cn(
            'p-2 rounded-lg transition-all duration-300',
            'bg-neutral-100/50 text-neutral-600 hover:text-neutral-800',
            'hover:bg-neutral-200/50 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'backdrop-blur-sm'
          )}
          aria-label="Pomoc"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </SidebarTooltip>
      
      {!isCollapsed && (
        <>
          <div className="flex-1" />
          <SidebarTooltip content={`Wersja ${version}`} side="top">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100/30 backdrop-blur-sm">
              <Info className="h-3 w-3 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">v{version}</span>
            </div>
          </SidebarTooltip>
        </>
      )}
    </div>
  )
}