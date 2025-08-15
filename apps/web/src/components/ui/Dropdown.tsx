import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface DropdownItem {
  /**
   * Unique identifier for the item
   */
  id: string
  /**
   * Display label for the item
   */
  label: string
  /**
   * Optional icon to display before the label
   */
  icon?: LucideIcon
  /**
   * Click handler for the item
   */
  onClick?: () => void
  /**
   * Whether the item is disabled
   */
  disabled?: boolean
  /**
   * Type of item - divider creates a visual separator
   */
  type?: 'item' | 'divider'
  /**
   * Danger styling for destructive actions
   */
  danger?: boolean
}

interface DropdownProps {
  /**
   * The trigger element that opens the dropdown
   */
  trigger: React.ReactNode
  /**
   * Array of dropdown items
   */
  items: DropdownItem[]
  /**
   * Alignment of the dropdown relative to the trigger
   */
  align?: 'left' | 'right'
  /**
   * Additional classes for the dropdown menu
   */
  className?: string
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className
}) => {
  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0'
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>
        {trigger}
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className={cn(
            "absolute z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-elevation-high ring-1 ring-black ring-opacity-5 focus:outline-none",
            alignmentClasses[align],
            className
          )}
        >
          <div className="py-1">
            {items.map((item) => {
              if (item.type === 'divider') {
                return (
                  <div
                    key={item.id}
                    className="my-1 h-px bg-neutral-200"
                  />
                )
              }

              return (
                <Menu.Item key={item.id} disabled={item.disabled}>
                  {({ active }: { active: boolean }) => (
                    <button
                      className={cn(
                        'group flex w-full items-center px-4 py-2 text-sm transition-colors',
                        active && !item.disabled ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700',
                        item.disabled && 'opacity-50 cursor-not-allowed',
                        item.danger && 'text-red-600 hover:bg-red-50 hover:text-red-700',
                        !item.danger && !item.disabled && 'hover:bg-neutral-100'
                      )}
                      onClick={item.onClick}
                      disabled={item.disabled}
                    >
                      {item.icon && (
                        <item.icon 
                          className={cn(
                            "mr-3 h-4 w-4",
                            item.danger ? 'text-red-500' : 'text-neutral-400',
                            active && !item.disabled && 'text-neutral-500'
                          )} 
                        />
                      )}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              )
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export { Dropdown }
export type { DropdownItem }