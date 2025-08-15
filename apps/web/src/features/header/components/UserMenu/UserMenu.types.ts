import type { HeaderUser } from '../../types'

export interface UserMenuProps {
  user: HeaderUser
  className?: string
}

export interface UserMenuItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  danger?: boolean
  divider?: boolean
}