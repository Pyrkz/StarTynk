export const SIDEBAR_CONSTANTS = {
  // Widths
  WIDTH: {
    COLLAPSED: 80,
    EXPANDED: 288,
    MOBILE: 320,
  },
  
  // Animation
  ANIMATION: {
    DURATION: 300,
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Storage
  STORAGE: {
    STATE_KEY: 'sidebar_state',
    RECENT_KEY: 'sidebar_recent',
    PINNED_KEY: 'sidebar_pinned',
  },
  
  // Limits
  LIMITS: {
    MAX_RECENT_ITEMS: 5,
    MAX_PINNED_ITEMS: 10,
    MAX_NESTED_LEVEL: 3,
  },
  
  // Z-index
  Z_INDEX: {
    SIDEBAR: 30,
    TOOLTIP: 40,
    MOBILE_OVERLAY: 35,
  },
  
  // Keyboard shortcuts
  SHORTCUTS: {
    TOGGLE_SIDEBAR: 'ctrl+b',
    SEARCH: 'ctrl+/',
  },
} as const

export const NAVIGATION_VARIANTS = {
  item: {
    default: 'text-neutral-600 hover:bg-neutral-100/60 hover:text-neutral-900 hover:shadow-sm',
    active: 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-900 font-medium shadow-sm relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary-400 before:to-primary-600 before:rounded-r-full before:animate-pulse',
    disabled: 'text-neutral-400 cursor-not-allowed opacity-50',
    subitem: {
      default: 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800',
      active: 'bg-neutral-100/80 text-neutral-900 font-medium',
    }
  },
  badge: {
    default: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/50',
    primary: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/50',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
    error: 'bg-red-50 text-red-700 ring-1 ring-red-200/50',
  },
  icon: {
    default: 'text-neutral-500',
    active: 'text-primary-600',
    hover: 'text-neutral-700',
  },
} as const

export const SIDEBAR_STYLES = {
  backdrop: 'bg-gradient-to-b from-neutral-50/50 to-white backdrop-blur-sm border-r border-neutral-200/50 shadow-sm',
  header: {
    base: 'bg-white/80 backdrop-blur-sm border-b border-neutral-200/50',
    logo: {
      gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20',
    },
  },
  footer: {
    base: 'bg-gradient-to-t from-neutral-100/50 to-transparent border-t border-neutral-200/50',
  },
} as const