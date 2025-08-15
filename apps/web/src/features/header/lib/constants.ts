export const HEADER_CONSTANTS = {
  // Animation durations
  ANIMATION: {
    DROPDOWN: 200,
    MOBILE_MENU: 300,
    NOTIFICATION: 150,
  },
  
  // Debounce delays
  DEBOUNCE: {
    SEARCH: 300,
    SCROLL: 50,
  },
  
  // Limits
  LIMITS: {
    MAX_NOTIFICATIONS: 100,
    MAX_RECENT_SEARCHES: 10,
    NOTIFICATION_PAGE_SIZE: 20,
  },
  
  // Storage keys
  STORAGE: {
    RECENT_SEARCHES: 'header_recent_searches',
    NOTIFICATIONS: 'header_notifications',
    PREFERENCES: 'header_preferences',
  },
  
  // Z-index values
  Z_INDEX: {
    HEADER: 40,
    DROPDOWN: 50,
    MOBILE_MENU: 60,
    NOTIFICATION_CENTER: 50,
  },
} as const

export const NOTIFICATION_SOUNDS = {
  info: '/sounds/notification-info.mp3',
  success: '/sounds/notification-success.mp3',
  warning: '/sounds/notification-warning.mp3',
  error: '/sounds/notification-error.mp3',
} as const