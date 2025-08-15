'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Users, 
  Filter, 
  Calendar, 
  DollarSign,
  ChevronDown,
  UserCheck,
  Wallet,
  Package,
  ShoppingCart,
  Smartphone,
  TrendingUp
} from 'lucide-react'

interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  dropdown?: DropdownItem[]
}

interface DropdownItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

const tabsConfig: TabConfig[] = [
  { id: 'apartments', label: 'Pomieszczenia i zadania', icon: Home },
  { 
    id: 'employees', 
    label: 'Pracownicy', 
    icon: Users,
    dropdown: [
      { id: 'team-overview', label: 'Przegląd zespołu', icon: UserCheck },
      { id: 'payroll-earnings', label: 'Wypłaty i zarobki', icon: Wallet }
    ]
  },
  { id: 'project-materials', label: 'Materiały projektowe', icon: Package },
  { id: 'active-orders', label: 'Aktywne zamówienia', icon: ShoppingCart },
  { id: 'mobile-requests', label: 'Zapytania mobilne', icon: Smartphone },
  { id: 'usage-analytics', label: 'Analiza zużycia', icon: TrendingUp },
  { id: 'quality', label: 'Kontrola jakości', icon: Filter },
  { id: 'deliveries', label: 'Dostawy', icon: Calendar },
  { id: 'finance', label: 'Przegląd finansów', icon: DollarSign }
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [openDropdownTab, setOpenDropdownTab] = useState<string | null>(null)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownButtonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        setOpenDropdownTab(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false)
        setOpenDropdownTab(null)
        dropdownButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDropdownOpen])

  const handleTabClick = (tab: TabConfig) => {
    if (tab.dropdown) {
      const shouldOpen = !(isDropdownOpen && openDropdownTab === tab.id)
      
      if (shouldOpen && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left
        })
      }
      
      setIsDropdownOpen(shouldOpen)
      setOpenDropdownTab(shouldOpen ? tab.id : null)
    } else {
      onTabChange(tab.id)
      setIsDropdownOpen(false)
      setOpenDropdownTab(null)
    }
  }

  const handleDropdownItemClick = (itemId: string) => {
    onTabChange(itemId)
    setIsDropdownOpen(false)
    setOpenDropdownTab(null)
  }

  const isEmployeeTabActive = activeTab === 'team-overview' || activeTab === 'payroll-earnings'

  return (
    <div className="border-b border-neutral-200 relative" style={{ overflow: 'visible' }}>
      <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
        <div className="flex space-x-0 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.dropdown 
              ? isEmployeeTabActive 
              : activeTab === tab.id
            const isHovered = hoveredTab === tab.id

            return (
              <div key={tab.id} className="relative">
                <button
                  ref={tab.dropdown ? dropdownButtonRef : undefined}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={cn(
                    "flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset",
                    isActive 
                      ? "border-primary-600 text-primary-600 bg-primary-50/50" 
                      : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                  aria-haspopup={tab.dropdown ? "true" : undefined}
                  aria-expanded={tab.dropdown ? isDropdownOpen : undefined}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.dropdown && (
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 ml-1 transition-transform duration-200",
                        isDropdownOpen ? "rotate-180" : ""
                      )} 
                    />
                  )}
                </button>

                {/* Dropdown Menu */}
                {tab.dropdown && isDropdownOpen && openDropdownTab === tab.id && (
                  <div
                    ref={dropdownRef}
                    className={cn(
                      "absolute min-w-[240px] bg-white rounded-lg shadow-xl border-2 border-blue-500",
                      "animate-in fade-in slide-in-from-top-1 duration-200"
                    )}
                    style={{ 
                      zIndex: 999999,
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`
                    }}
                    role="menu"
                  >
                    {tab.dropdown.map((item, index) => {
                      const ItemIcon = item.icon
                      const isItemActive = activeTab === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleDropdownItemClick(item.id)}
                          className={cn(
                            "w-full flex items-center px-4 py-3 text-sm transition-colors",
                            "focus:outline-none focus:bg-primary-50 focus:text-primary-700",
                            index === 0 ? "rounded-t-lg" : "",
                            index === tab.dropdown!.length - 1 ? "rounded-b-lg" : "",
                            isItemActive
                              ? "bg-primary-50 text-primary-700 font-medium"
                              : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                          role="menuitem"
                        >
                          <ItemIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}