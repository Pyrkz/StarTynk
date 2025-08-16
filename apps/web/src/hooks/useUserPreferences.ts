import { useState, useEffect, useCallback } from 'react'
import { createWebStorage } from '@repo/shared/storage'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'pl' | 'en'
  sidebarCollapsed: boolean
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'pl',
  sidebarCollapsed: false,
  notifications: {
    email: true,
    push: true,
    sound: true,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
  },
}

// Create storage instance with validation
const preferencesStorage = createWebStorage<UserPreferences>({
  key: 'user_preferences',
  defaultValue: defaultPreferences,
  // Optional: Add validation to ensure data integrity
  validate: (value: any): value is UserPreferences => {
    return (
      typeof value === 'object' &&
      ['light', 'dark', 'system'].includes(value.theme) &&
      ['pl', 'en'].includes(value.language) &&
      typeof value.sidebarCollapsed === 'boolean'
    )
  },
})

/**
 * Custom hook for managing user preferences with unified storage
 * Features:
 * - Type-safe preference management
 * - Cross-tab synchronization
 * - Partial updates
 * - Migration support
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await preferencesStorage.getAsync()
        setPreferences(stored)
      } catch (error) {
        console.error('Failed to load preferences:', error)
        // Use defaults on error
        setPreferences(defaultPreferences)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()

    // Subscribe to storage changes for cross-tab synchronization
    const unsubscribe = preferencesStorage.subscribe((newPreferences) => {
      setPreferences(newPreferences)
    })

    return unsubscribe
  }, [])

  // Update preferences (supports partial updates)
  const updatePreferences = useCallback(async (
    updates: Partial<UserPreferences> | ((prev: UserPreferences) => Partial<UserPreferences>)
  ) => {
    const newPreferences = {
      ...preferences,
      ...(typeof updates === 'function' ? updates(preferences) : updates),
    }

    setPreferences(newPreferences)

    try {
      await preferencesStorage.set(newPreferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      // Rollback on error
      setPreferences(preferences)
      throw error
    }
  }, [preferences])

  // Convenience methods for common operations
  const toggleTheme = useCallback(() => {
    const themes: Array<UserPreferences['theme']> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(preferences.theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    
    return updatePreferences({ theme: nextTheme })
  }, [preferences.theme, updatePreferences])

  const toggleSidebar = useCallback(() => {
    return updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })
  }, [preferences.sidebarCollapsed, updatePreferences])

  const setLanguage = useCallback((language: UserPreferences['language']) => {
    return updatePreferences({ language })
  }, [updatePreferences])

  const updateNotificationSettings = useCallback((
    settings: Partial<UserPreferences['notifications']>
  ) => {
    return updatePreferences({
      notifications: { ...preferences.notifications, ...settings }
    })
  }, [preferences.notifications, updatePreferences])

  const updateAccessibilitySettings = useCallback((
    settings: Partial<UserPreferences['accessibility']>
  ) => {
    return updatePreferences({
      accessibility: { ...preferences.accessibility, ...settings }
    })
  }, [preferences.accessibility, updatePreferences])

  // Reset to defaults
  const resetPreferences = useCallback(async () => {
    setPreferences(defaultPreferences)
    
    try {
      await preferencesStorage.set(defaultPreferences)
    } catch (error) {
      console.error('Failed to reset preferences:', error)
      throw error
    }
  }, [])

  return {
    preferences,
    isLoading,
    updatePreferences,
    toggleTheme,
    toggleSidebar,
    setLanguage,
    updateNotificationSettings,
    updateAccessibilitySettings,
    resetPreferences,
  }
}