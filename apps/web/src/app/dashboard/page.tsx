'use client'

// import { useSession } from 'next-auth/react' // Temporarily disabled for client demo
import Link from 'next/link'
// import { AuthGuard } from '@/components/auth/AuthGuard' // Temporarily disabled for client demo
import { 
  FolderKanban,
  Shield,
  DollarSign,
  Package,
  Wrench,
  Truck,
  Car,
  BarChart3,
  Users2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStatsCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface SectionCard {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  stats?: {
    primary: string
    secondary?: string
  }
  status?: 'good' | 'warning' | 'critical'
  requiredRole?: string
  color: string
}

export default function DashboardPage() {
  // const { data: session } = useSession() // Temporarily disabled for client demo
  const session = null // Mock session for demo

  // Mock data dla szybkich statystyk
  const quickStats: QuickStatsCard[] = [
    {
      title: 'Aktywne projekty',
      value: '12',
      change: '+2 ten miesiąc',
      changeType: 'increase',
      icon: FolderKanban,
      color: 'blue'
    },
    {
      title: 'Przychody miesięczne',
      value: '184,500 PLN',
      change: '+15.3% vs poprzedni',
      changeType: 'increase',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Oczekujące dostawy',
      value: '8',
      change: '2 spóźnione',
      changeType: 'decrease',
      icon: Truck,
      color: 'orange'
    },
    {
      title: 'Zespół',
      value: '24 pracowników',
      change: '96% obecność',
      changeType: 'increase',
      icon: Users2,
      color: 'purple'
    }
  ]

  // Główne sekcje systemu
  const sections: SectionCard[] = [
    {
      id: 'projects',
      title: 'Projekty i zadania',
      description: 'Zarządzaj projektami tynkarskimi, mieszkaniami i zadaniami',
      href: '/dashboard/projekty',
      icon: FolderKanban,
      stats: {
        primary: '12 aktywnych',
        secondary: '3 do odbioru'
      },
      status: 'good',
      color: 'blue'
    },
    {
      id: 'quality',
      title: 'Kontrola jakości',
      description: 'Monitoring jakości prac, odbiory techniczne',
      href: '/dashboard/kontrola-jakosci',
      icon: Shield,
      stats: {
        primary: '5 do sprawdzenia',
        secondary: '92% wskaźnik jakości'
      },
      status: 'warning',
      requiredRole: 'MODERATOR',
      color: 'emerald'
    },
    {
      id: 'employees',
      title: 'Pracownicy',
      description: 'Zespół, wypłaty, harmonogramy pracy',
      href: '/dashboard/pracownicy',
      icon: Users2,
      stats: {
        primary: '24 pracowników',
        secondary: '96% obecność'
      },
      status: 'good',
      requiredRole: 'MODERATOR',
      color: 'purple'
    },
    {
      id: 'finance',
      title: 'Finanse',
      description: 'Przegląd finansowy, budżety, rozliczenia',
      href: '/dashboard/finanse',
      icon: DollarSign,
      stats: {
        primary: '184,500 PLN',
        secondary: '+15.3% MoM'
      },
      status: 'good',
      requiredRole: 'ADMIN',
      color: 'green'
    },
    {
      id: 'orders',
      title: 'Zamówienia i magazyny',
      description: 'Zamówienia materiałów, stan magazynu',
      href: '/dashboard/zamowienia',
      icon: Package,
      stats: {
        primary: '15 zamówień',
        secondary: '85% zapasów'
      },
      status: 'good',
      color: 'amber'
    },
    {
      id: 'equipment',
      title: 'Magazyn sprzętu',
      description: 'Sprzęt tynkarski, narzędzia, inwentaryzacja',
      href: '/dashboard/magazyn',
      icon: Wrench,
      stats: {
        primary: '142 pozycji',
        secondary: '12 w serwisie'
      },
      status: 'good',
      color: 'slate'
    },
    {
      id: 'delivery',
      title: 'Dostawy',
      description: 'Harmonogram dostaw, odbiór materiałów',
      href: '/dashboard/dostawy',
      icon: Truck,
      stats: {
        primary: '8 oczekujących',
        secondary: '2 spóźnione'
      },
      status: 'warning',
      color: 'orange'
    },
    {
      id: 'fleet',
      title: 'Nasza flota',
      description: 'Pojazdy firmowe, przeglądy, remonty',
      href: '/dashboard/flota',
      icon: Car,
      stats: {
        primary: '6 pojazdów',
        secondary: '1 w serwisie'
      },
      status: 'good',
      color: 'blue'
    },
    {
      id: 'reports',
      title: 'Raporty i analiza',
      description: 'Analizy, statystyki, raporty biznesowe',
      href: '/dashboard/raporty',
      icon: BarChart3,
      stats: {
        primary: '28 raportów',
        secondary: 'Ostatnia aktualizacja: dziś'
      },
      status: 'good',
      requiredRole: 'MODERATOR',
      color: 'indigo'
    }
  ]

  const hasRole = (requiredRole?: string) => {
    // Temporarily allow all roles for client demo
    return true
    // if (!requiredRole) return true
    // if (!session?.user?.role) return false
    // 
    // const roleHierarchy = { 'USER': 0, 'MODERATOR': 1, 'ADMIN': 2 }
    // const userLevel = roleHierarchy[session.user.role as keyof typeof roleHierarchy] || 0
    // const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
    // 
    // return userLevel >= requiredLevel
  }

  const filteredSections = sections.filter(section => hasRole(section.requiredRole))

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
    }
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant]
  }

  return (
    // <AuthGuard> // Temporarily disabled for client demo
      <div className="min-h-screen bg-neutral-50">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Panel główny
                </h1>
                <p className="text-neutral-600">
                  Witaj! Przegląd operacji firmy tynkarskiej
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-500">
                  {new Date().toLocaleDateString('pl-PL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-semibold text-neutral-900">
                  {new Date().toLocaleTimeString('pl-PL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon
              const isIncrease = stat.changeType === 'increase'
              
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      getColorClasses(stat.color, 'bg')
                    )}>
                      <Icon className={cn("w-6 h-6", getColorClasses(stat.color, 'text'))} />
                    </div>
                    {isIncrease ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-sm font-medium text-neutral-600">{stat.title}</p>
                    <p className={cn(
                      "text-xs",
                      isIncrease ? "text-green-600" : "text-red-600"
                    )}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main Sections */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                Sekcje systemu
              </h2>
              <div className="text-sm text-neutral-500">
                {filteredSections.length} dostępnych sekcji
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSections.map((section) => {
                const Icon = section.icon
                
                return (
                  <Link key={section.id} href={section.href}>
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          getColorClasses(section.color, 'bg')
                        )}>
                          <Icon className={cn("w-6 h-6", getColorClasses(section.color, 'text'))} />
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(section.status)}
                          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                            {section.title}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            {section.description}
                          </p>
                        </div>

                        {/* Stats */}
                        {section.stats && (
                          <div className="pt-3 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-neutral-900">
                                {section.stats.primary}
                              </span>
                              {section.stats.secondary && (
                                <span className="text-xs text-neutral-500">
                                  {section.stats.secondary}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Role Badge */}
                        {section.requiredRole && (
                          <div className="pt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                              {section.requiredRole === 'ADMIN' ? 'Admin' : 'Moderator'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Ostatnia aktywność
              </h2>
              <Link href="/dashboard/raporty" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Zobacz wszystkie →
              </Link>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  type: 'projekt',
                  title: 'Zakończono tynkowanie w mieszkaniu 15A',
                  project: 'Osiedle Słoneczne',
                  time: '2 godziny temu',
                  icon: CheckCircle,
                  color: 'text-green-600'
                },
                {
                  type: 'dostawa',
                  title: 'Odebrano materiały od Knauf Polska',
                  project: '450kg gipsu MP75',
                  time: '4 godziny temu',
                  icon: Truck,
                  color: 'text-blue-600'
                },
                {
                  type: 'jakość',
                  title: 'Kontrola jakości - mieszkanie 12B',
                  project: 'Wymaga poprawek',
                  time: '6 godzin temu',
                  icon: AlertCircle,
                  color: 'text-yellow-600'
                },
                {
                  type: 'zespół',
                  title: 'Jan Kowalski rozpoczął pracę nad mieszkaniem 18C',
                  project: 'Biurowiec Horizon',
                  time: '1 dzień temu',
                  icon: Users2,
                  color: 'text-purple-600'
                }
              ].map((activity, index) => {
                const Icon = activity.icon
                
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <Icon className={cn("w-5 h-5 mt-0.5", activity.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {activity.project}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    // </AuthGuard> // Temporarily disabled for client demo
  )
}