import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusFilterProps } from './StatusFilter.types'

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  options,
  className
}) => {
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
        className={cn(
          'appearance-none',
          'w-full px-4 py-2.5 pr-10',
          'bg-white border border-neutral-300 rounded-lg',
          'text-sm text-neutral-900',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'transition-all duration-200',
          'cursor-pointer'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </div>

      {selectedOption?.color && value !== 'ALL' && (
        <div 
          className={cn(
            'absolute left-3 top-1/2 transform -translate-y-1/2',
            'w-2 h-2 rounded-full',
            selectedOption.color
          )}
        />
      )}
    </div>
  )
}