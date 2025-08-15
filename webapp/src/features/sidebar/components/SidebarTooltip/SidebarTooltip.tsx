'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SIDEBAR_CONSTANTS } from '../../lib/constants'

interface SidebarTooltipProps {
  content: string
  children: React.ReactNode
  side?: 'left' | 'right'
  delay?: number
  className?: string
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  content,
  children,
  side = 'right',
  delay = 500,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const top = rect.top + rect.height / 2
      const left = side === 'right' ? rect.right + 12 : rect.left - 12
      
      setPosition({ top, left })
      
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, delay)
    }
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            'fixed z-50 pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-50%)',
            zIndex: SIDEBAR_CONSTANTS.Z_INDEX.TOOLTIP,
          }}
        >
          <div
            className={cn(
              'bg-gray-900 text-white text-sm font-medium',
              'px-3 py-2 rounded-lg shadow-lg',
              'max-w-xs',
              side === 'right' && 'origin-left',
              side === 'left' && 'origin-right translate-x-[-100%]'
            )}
          >
            {content}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2',
                'w-0 h-0 border-y-[6px] border-y-transparent',
                side === 'right' && 'left-[-6px] border-r-[6px] border-r-gray-900',
                side === 'left' && 'right-[-6px] border-l-[6px] border-l-gray-900'
              )}
            />
          </div>
        </div>
      )}
    </>
  )
}