import { Badge } from '@/components/ui/Badge';
import { MockCategory } from '@/features/equipment/types/equipment.types';

interface CategoryCardProps {
  category: MockCategory;
  onClick: (category: MockCategory) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick
}) => {
  const utilizationRate = category.totalCount > 0 
    ? ((category.assignedCount / category.totalCount) * 100).toFixed(1)
    : '0';

  const getUtilizationColor = (rate: number): string => {
    if (rate >= 80) return 'text-red-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const utilRate = parseFloat(utilizationRate);

  return (
    <div
      onClick={() => onClick(category)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 group"
    >
      <div className="p-6">
        {/* Header with Icon and Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
              {category.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {category.totalCount}
            </div>
            <div className="text-xs text-gray-500">Łącznie</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-1 text-sm">
            <span className="text-gray-600">Dostępne:</span>
            <span className="font-medium text-gray-900">{category.availableCount}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm">
            <span className="text-gray-600">Wydane:</span>
            <span className="font-medium text-gray-900">{category.assignedCount}</span>
          </div>
          
          {category.damagedCount > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-600">Uszkodzone:</span>
              <span className="font-medium text-amber-700">{category.damagedCount}</span>
            </div>
          )}
        </div>

        {/* Availability Info */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Dostępność</span>
            <span className="text-sm font-semibold text-gray-900">
              {category.availableCount}/{category.totalCount} dostępnych
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                utilRate >= 80 
                  ? 'bg-amber-500' 
                  : utilRate >= 60 
                  ? 'bg-slate-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(utilRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors">
            <div className="text-lg font-semibold text-gray-900">
              {category.availableCount}
            </div>
            <div className="text-xs text-gray-600">Gotowe do wydania</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors">
            <div className="text-lg font-semibold text-gray-900">
              {category.assignedCount}
            </div>
            <div className="text-xs text-gray-600">W użyciu</div>
          </div>
        </div>

        {/* Action Hint */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
            <span>Kliknij aby zarządzać</span>
            <svg 
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Warning Indicators */}
      {category.damagedCount > 0 && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
      
      {utilRate >= 90 && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default CategoryCard;