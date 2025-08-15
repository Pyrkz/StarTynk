'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Clock, Command } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '../../hooks/useDebounce'
import { loadRecentSearches, saveRecentSearches, generateId } from '../../lib/utils'
import { HEADER_CONSTANTS } from '../../lib/constants'
import type { SearchBarProps } from './SearchBar.types'
import type { RecentSearch } from '../../types'

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Szukaj...',
  className,
  onSearch,
  suggestions = [],
  showRecent = true,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const debouncedQuery = useDebounce(query, HEADER_CONSTANTS.DEBOUNCE.SEARCH)

  // Load recent searches on mount
  useEffect(() => {
    if (showRecent) {
      setRecentSearches(loadRecentSearches())
    }
  }, [showRecent])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [])

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && onSearch) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (query.trim()) {
      // Save to recent searches
      if (showRecent) {
        const newSearch: RecentSearch = {
          id: generateId(),
          query: query.trim(),
          timestamp: new Date(),
          resultsCount: 0, // This could be updated based on actual results
        }
        
        const updated = [
          newSearch,
          ...recentSearches.filter(s => s.query !== query.trim())
        ].slice(0, HEADER_CONSTANTS.LIMITS.MAX_RECENT_SEARCHES)
        
        setRecentSearches(updated)
        saveRecentSearches(updated)
      }
      
      if (onSearch) {
        onSearch(query.trim())
      }
      
      setShowSuggestions(false)
    }
  }, [query, recentSearches, showRecent, onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
    if (onSearch) {
      onSearch('')
    }
  }, [onSearch])

  const handleRecentSearch = useCallback((search: RecentSearch) => {
    setQuery(search.query)
    setShowSuggestions(false)
    if (onSearch) {
      onSearch(search.query)
    }
  }, [onSearch])

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  )

  const shouldShowDropdown = showSuggestions && (
    (showRecent && recentSearches.length > 0 && !query) ||
    (query && filteredSuggestions.length > 0)
  )

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search 
            className={cn(
              'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
              isFocused ? 'text-gray-600' : 'text-gray-400'
            )}
          />
          
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              setIsFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-gray-50',
              'py-2 pl-10 pr-20 text-sm text-gray-900',
              'placeholder-gray-500 transition-all',
              'focus:border-primary-500 focus:bg-white focus:outline-none',
              'focus:ring-2 focus:ring-primary-500/20'
            )}
          />
          
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                aria-label="Wyczyść"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <kbd className="hidden lg:inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </div>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute left-0 right-0 mt-2 origin-top',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            'rounded-lg bg-white shadow-lg ring-1 ring-gray-200',
            'max-h-96 overflow-y-auto'
          )}
          style={{ zIndex: HEADER_CONSTANTS.Z_INDEX.DROPDOWN }}
        >
          {/* Recent searches */}
          {showRecent && recentSearches.length > 0 && !query && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-500">
                Ostatnie wyszukiwania
              </p>
              {recentSearches.map(search => (
                <button
                  key={search.id}
                  onClick={() => handleRecentSearch(search)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2',
                    'text-left text-sm hover:bg-gray-50 transition-colors'
                  )}
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="flex-1">{search.query}</span>
                  <span className="text-xs text-gray-500">
                    {search.resultsCount} wyników
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search suggestions */}
          {query && filteredSuggestions.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-500">
                Sugestie
              </p>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion)
                    setShowSuggestions(false)
                    if (onSearch) {
                      onSearch(suggestion)
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2',
                    'text-left text-sm hover:bg-gray-50 transition-colors'
                  )}
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: suggestion.replace(
                        new RegExp(query, 'gi'),
                        match => `<mark class="bg-yellow-200">${match}</mark>`
                      )
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}