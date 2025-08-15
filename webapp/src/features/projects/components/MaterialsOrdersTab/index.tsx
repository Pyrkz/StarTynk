'use client';

import { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProjectMaterialsSubTab from './ProjectMaterialsSubTab';
import ActiveOrdersSubTab from './ActiveOrdersSubTab';
import MobileRequestsSubTab from './MobileRequestsSubTab';
import UsageAnalyticsSubTab from './UsageAnalyticsSubTab';
import MaterialsSummaryCards from './MaterialsSummaryCards';

interface MaterialsOrdersTabProps {
  projectId: string;
}

type SubTabType = 'materials' | 'orders' | 'mobile' | 'analytics';

const MaterialsOrdersTab = ({ projectId }: MaterialsOrdersTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('materials');

  const subTabs = [
    { id: 'materials' as const, label: 'Materiały projektowe', icon: Package },
    { id: 'orders' as const, label: 'Aktywne zamówienia', icon: ShoppingCart },
    { id: 'mobile' as const, label: 'Zapytania mobilne', icon: Smartphone },
    { id: 'analytics' as const, label: 'Analiza zużycia', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <MaterialsSummaryCards projectId={projectId} />

      {/* Sub Navigation */}
      <div className="bg-white rounded-lg shadow-elevation-low overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                    activeSubTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/50"
                      : "text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub Tab Content */}
        <div className="p-6">
          {activeSubTab === 'materials' && (
            <ProjectMaterialsSubTab projectId={projectId} />
          )}
          {activeSubTab === 'orders' && (
            <ActiveOrdersSubTab projectId={projectId} />
          )}
          {activeSubTab === 'mobile' && (
            <MobileRequestsSubTab projectId={projectId} />
          )}
          {activeSubTab === 'analytics' && (
            <UsageAnalyticsSubTab projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsOrdersTab;