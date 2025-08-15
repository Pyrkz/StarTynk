import type { Notification } from '../../types'

export interface NotificationCenterProps {
  className?: string
}

export interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onRemove: (id: string) => void
  onAction?: (notification: Notification) => void
}

export interface NotificationBadgeProps {
  count: number
  pulse?: boolean
  className?: string
}