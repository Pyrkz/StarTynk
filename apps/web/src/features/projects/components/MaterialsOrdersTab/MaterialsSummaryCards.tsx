'use client';

import { Package, DollarSign, Truck, Smartphone, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialsSummaryCardsProps {
  projectId: string;
}

interface SummaryCard {
  title: string;
  icon: React.ElementType;
  mainValue: string;
  subtitle: string;
  description: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor: string;
  iconColor: string;
}

const MaterialsSummaryCards = ({ projectId }: MaterialsSummaryCardsProps) => {
  // TODO: Replace with real data from API
  const summaryData: SummaryCard[] = [
    {
      title: 'Łączna liczba materiałów',
      icon: Package,
      mainValue: '156 pozycji',
      subtitle: 'Kategorie materiałów',
      description: '45 eksploatacyjnych, 23 narzędzia, 88 materiałów',
      trend: {
        value: '142 dostarczonych, 14 oczekujących',
        isPositive: true
      },
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Wartość magazynu',
      icon: DollarSign,
      mainValue: '47 580 zł',
      subtitle: 'Wpływ na budżet',
      description: '68% budżetu materiałowego wykorzystane',
      trend: {
        value: '+3 200 zł w tym miesiącu',
        isPositive: false
      },
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Aktywne zamówienia',
      icon: Truck,
      mainValue: '12 zamówień',
      subtitle: 'Status zamówień',
      description: '3 nowe, 5 w realizacji, 4 w transporcie',
      trend: {
        value: '2 pilne zamówienia',
        isPositive: false
      },
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Zamówienia mobilne',
      icon: Smartphone,
      mainValue: '8 nowych',
      subtitle: 'Aktywność dzisiaj',
      description: '5 zamówień złożonych dzisiaj',
      trend: {
        value: '3 oczekują na zatwierdzenie',
        isPositive: true
      },
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryData.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-elevation-low hover:shadow-elevation-medium transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-lg", card.iconBgColor)}>
                <Icon className={cn("h-6 w-6", card.iconColor)} />
              </div>
              {card.trend && (
                <div className="flex items-center gap-1">
                  {card.trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-2">{card.mainValue}</p>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">{card.subtitle}</p>
              <p className="text-sm text-gray-600">{card.description}</p>
              {card.trend && (
                <p className={cn(
                  "text-xs font-medium mt-2",
                  card.trend.isPositive ? "text-green-600" : "text-orange-600"
                )}>
                  {card.trend.value}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaterialsSummaryCards;