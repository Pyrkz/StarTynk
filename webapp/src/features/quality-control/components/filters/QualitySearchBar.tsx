'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface QualitySearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const QualitySearchBar: React.FC<QualitySearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Szukaj po nazwie zadania, projekcie, wykonawcy...',
  className
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
  }, [onChange])

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />

        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
            title="Wyczyść"
          >
            <svg
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

    </div>
  )
}