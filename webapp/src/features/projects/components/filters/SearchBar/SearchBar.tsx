import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBarProps } from './SearchBar.types'

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Szukaj...',
  isLoading = false,
  className
}) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    onSubmit?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    
    // Debounce search
    if (!onSubmit) {
      const timeoutId = setTimeout(() => {
        onChange(newValue)
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) {
            e.preventDefault()
            onChange(localValue)
            onSubmit()
          }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-10 py-2.5',
          'border border-neutral-300 rounded-lg',
          'text-neutral-900 placeholder-neutral-500',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'transition-all duration-200',
          'text-sm',
          isLoading && 'opacity-60 cursor-wait'
        )}
        disabled={isLoading}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Wyczyść wyszukiwanie"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}