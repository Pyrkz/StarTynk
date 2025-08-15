import {
  Home,
  Users,
  Package,
  Truck,
  CheckCircle,
  DollarSign,
  FolderOpen,
  Car,
  ShoppingCart,
  Settings,
  BarChart3,
  Wrench,
  Package2,
  UserCheck,
  Send,
  Receipt,
  FileText,
  Boxes,
  ClipboardList,
} from 'lucide-react'
import type { NavigationItem, UserRole } from '../../types'

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
  },
  
  // Magazyn
  {
    id: 'magazyn',
    label: 'Magazyn',
    icon: Package,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
    children: [
      {
        id: 'magazyn-przeglad',
        label: 'Przegląd',
        href: '/dashboard/magazyn',
        icon: Boxes,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'magazyn-wydaj',
        label: 'Wydaj przedmiot',
        href: '/dashboard/magazyn/wydaj',
        icon: Send,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'magazyn-pracownicy',
        label: 'Pracownicy',
        href: '/dashboard/magazyn/pracownicy',
        icon: UserCheck,
        allowedRoles: ['MODERATOR', 'ADMIN'],
      },
    ],
  },
  
  // Zamówienia
  {
    id: 'zamowienia',
    label: 'Zamówienia',
    icon: ShoppingCart,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
    children: [
      {
        id: 'zamowienia-nowe',
        label: 'Nowe zamówienie',
        href: '/dashboard/zamowienia/nowe',
        icon: FileText,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'zamowienia-katalog',
        label: 'Katalog',
        href: '/dashboard/zamowienia/katalog',
        icon: Package2,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'zamowienia-magazyn',
        label: 'Stan magazynowy',
        href: '/dashboard/zamowienia/magazyn',
        icon: Boxes,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
    ],
  },
  
  // Dostawy
  {
    id: 'dostawy',
    label: 'Dostawy',
    icon: Truck,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
    children: [
      {
        id: 'dostawy-lista',
        label: 'Lista dostaw',
        href: '/dashboard/dostawy',
        icon: ClipboardList,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'dostawy-odbior',
        label: 'Odbiór',
        href: '/dashboard/dostawy/odbiór',
        icon: Receipt,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
    ],
  },
  
  // Kontrola jakości
  {
    id: 'kontrola-jakosci',
    label: 'Kontrola jakości',
    href: '/dashboard/kontrola-jakosci',
    icon: CheckCircle,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
  },
  
  // Projekty
  {
    id: 'projekty',
    label: 'Projekty',
    icon: FolderOpen,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
    children: [
      {
        id: 'projekty-lista',
        label: 'Lista projektów',
        href: '/dashboard/projekty',
        icon: FolderOpen,
        allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
      },
      {
        id: 'projekty-dodaj',
        label: 'Dodaj projekt',
        href: '/dashboard/projekty/dodaj-projekt',
        icon: FileText,
        allowedRoles: ['MODERATOR', 'ADMIN'],
      },
    ],
  },
  
  // Finanse
  {
    id: 'finanse',
    label: 'Finanse',
    href: '/dashboard/finanse',
    icon: DollarSign,
    allowedRoles: ['MODERATOR', 'ADMIN'],
  },
  
  // Pracownicy
  {
    id: 'pracownicy',
    label: 'Pracownicy',
    href: '/dashboard/pracownicy',
    icon: Users,
    allowedRoles: ['MODERATOR', 'ADMIN'],
  },
  
  // Flota
  {
    id: 'flota',
    label: 'Flota',
    href: '/dashboard/flota',
    icon: Car,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
  },
  
  // Sprzęt
  {
    id: 'sprzet',
    label: 'Sprzęt',
    href: '/dashboard/sprzet',
    icon: Wrench,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
  },
  
  // Użytkownicy
  {
    id: 'uzytkownicy',
    label: 'Użytkownicy',
    href: '/dashboard/uzytkownicy',
    icon: Users,
    allowedRoles: ['ADMIN'],
  },
  
  // Raporty
  {
    id: 'raporty',
    label: 'Raporty',
    href: '/dashboard/raporty',
    icon: BarChart3,
    allowedRoles: ['MODERATOR', 'ADMIN'],
  },
  
  // Ustawienia
  {
    id: 'ustawienia',
    label: 'Ustawienia',
    href: '/dashboard/ustawienia',
    icon: Settings,
    allowedRoles: ['USER', 'MODERATOR', 'ADMIN'],
    position: 'bottom',
  },
]

// Funkcja pomocnicza do filtrowania nawigacji na podstawie roli
export function filterNavigationByRole(
  navigation: NavigationItem[],
  userRole: UserRole
): NavigationItem[] {
  return navigation
    .filter((item) => item.allowedRoles?.includes(userRole))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, userRole)
        : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0)
}

// Funkcja pomocnicza do znalezienia aktywnego elementu
export function findActiveItem(
  navigation: NavigationItem[],
  pathname: string
): NavigationItem | null {
  for (const item of navigation) {
    if (item.href === pathname) {
      return item
    }
    if (item.children) {
      const activeChild = findActiveItem(item.children, pathname)
      if (activeChild) {
        return activeChild
      }
    }
  }
  return null
}

// Funkcja pomocnicza do sprawdzenia czy element ma aktywne dziecko
export function hasActiveChild(
  item: NavigationItem,
  pathname: string
): boolean {
  if (!item.children) return false
  
  for (const child of item.children) {
    if (child.href === pathname) return true
    if (child.children && hasActiveChild(child, pathname)) return true
  }
  
  return false
}