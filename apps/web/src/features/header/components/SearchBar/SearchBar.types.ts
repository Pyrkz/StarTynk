export interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  suggestions?: string[]
  showRecent?: boolean
}