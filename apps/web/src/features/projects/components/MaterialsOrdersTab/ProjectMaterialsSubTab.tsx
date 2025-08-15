'use client';

import { useState } from 'react';
import { 
  Search, 
  ShoppingCart,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Zap,
  Wrench,
  Paintbrush
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import MaterialDetailModal from './MaterialDetailModal';

interface ProjectMaterialsSubTabProps {
  projectId: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  supplier: string;
  imageUrl?: string;
  currentStock: number;
  allocatedQuantity: number;
  unit: string;
  lastDeliveryDate: string;
  usedThisMonth: number;
  remaining: number;
  burnRate: number;
  stockStatus: 'inStock' | 'lowStock' | 'outOfStock' | 'onOrder';
}

const ProjectMaterialsSubTab = ({ projectId }: ProjectMaterialsSubTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tynki gipsowe':
        return Package;
      case 'Tynki cementowo-wapienne':
        return Wrench;
      case 'Tynki dekoracyjne':
        return Paintbrush;
      case 'Materiały pomocnicze':
        return Zap;
      default:
        return Package;
    }
  };

  // Mock data - replace with API call
  const materials: Material[] = [
    {
      id: '1',
      name: 'Gips szpachlowy Knauf MP75',
      category: 'Tynki gipsowe',
      supplier: 'Knauf Polska',
      currentStock: 45,
      allocatedQuantity: 200,
      unit: 'worków',
      lastDeliveryDate: '15.04.2024',
      usedThisMonth: 85,
      remaining: 115,
      burnRate: 25,
      stockStatus: 'lowStock'
    },
    {
      id: '2',
      name: 'Cement portlandzki CEM I 42,5R',
      category: 'Tynki cementowo-wapienne',
      supplier: 'Cemex Polska',
      currentStock: 120,
      allocatedQuantity: 180,
      unit: 'worków',
      lastDeliveryDate: '10.04.2024',
      usedThisMonth: 35,
      remaining: 145,
      burnRate: 12,
      stockStatus: 'inStock'
    },
    {
      id: '3',
      name: 'Wapno hydratyzowane',
      category: 'Tynki cementowo-wapienne',
      supplier: 'Lhoist Polska',
      currentStock: 8,
      allocatedQuantity: 100,
      unit: 'worków',
      lastDeliveryDate: '20.04.2024',
      usedThisMonth: 52,
      remaining: 48,
      burnRate: 15,
      stockStatus: 'outOfStock'
    },
    {
      id: '4',
      name: 'Tynk dekoracyjny strukturalny',
      category: 'Tynki dekoracyjne',
      supplier: 'Atlas Polska',
      currentStock: 85,
      allocatedQuantity: 120,
      unit: 'kg',
      lastDeliveryDate: '18.04.2024',
      usedThisMonth: 25,
      remaining: 95,
      burnRate: 8,
      stockStatus: 'inStock'
    },
    {
      id: '5',
      name: 'Siatka zbrojąca do tynków',
      category: 'Materiały pomocnicze',
      supplier: 'Mapei Polska',
      currentStock: 180,
      allocatedQuantity: 250,
      unit: 'metrów',
      lastDeliveryDate: '12.04.2024',
      usedThisMonth: 45,
      remaining: 205,
      burnRate: 18,
      stockStatus: 'inStock'
    },
    {
      id: '6',
      name: 'Narożniki aluminiowe',
      category: 'Materiały pomocnicze',
      supplier: 'Profil System',
      currentStock: 25,
      allocatedQuantity: 200,
      unit: 'sztuk',
      lastDeliveryDate: '08.04.2024',
      usedThisMonth: 95,
      remaining: 105,
      burnRate: 30,
      stockStatus: 'lowStock'
    },
    {
      id: '7',
      name: 'Grunt głęboko penetrujący',
      category: 'Tynki dekoracyjne',
      supplier: 'Ceresit Henkel',
      currentStock: 0,
      allocatedQuantity: 50,
      unit: 'litrów',
      lastDeliveryDate: '22.03.2024',
      usedThisMonth: 35,
      remaining: 15,
      burnRate: 12,
      stockStatus: 'onOrder'
    },
    {
      id: '8',
      name: 'Gips szpachlowy do wykończeń',
      category: 'Tynki gipsowe',
      supplier: 'Nida Gips',
      currentStock: 65,
      allocatedQuantity: 150,
      unit: 'worków',
      lastDeliveryDate: '16.04.2024',
      usedThisMonth: 42,
      remaining: 108,
      burnRate: 16,
      stockStatus: 'inStock'
    }
  ];

  const categories = ['all', 'Tynki gipsowe', 'Tynki cementowo-wapienne', 'Tynki dekoracyjne', 'Materiały pomocnicze'];
  const statuses = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'inStock', label: 'W magazynie' },
    { value: 'lowStock', label: 'Niski stan' },
    { value: 'outOfStock', label: 'Brak w magazynie' },
    { value: 'onOrder', label: 'W zamówieniu' }
  ];
  const locations = ['all', 'Magazyn tynków', 'Magazyn gipsowy', 'Magazyn cementowy', 'Magazyn pomocniczy'];
  const sortOptions = [
    { value: 'name', label: 'Nazwa' },
    { value: 'quantity', label: 'Ilość' },
    { value: 'value', label: 'Wartość' },
    { value: 'updated', label: 'Ostatnia aktualizacja' }
  ];

  const getStockStatusBadge = (status: Material['stockStatus']) => {
    switch (status) {
      case 'inStock':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            W magazynie
          </Badge>
        );
      case 'lowStock':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Niski stan
          </Badge>
        );
      case 'outOfStock':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Brak w magazynie
          </Badge>
        );
      case 'onOrder':
        return (
          <Badge variant="neutral" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            W zamówieniu
          </Badge>
        );
    }
  };

  const getStockPercentage = (remaining: number, allocated: number) => {
    return Math.round((remaining / allocated) * 100);
  };

  const handleViewDetails = (material: Material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  return (
    <>
      {/* Filters and Search */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj materiałów, kategorii, dostawców..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Wszystkie kategorie' : category}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {locations.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'Wszystkie lokalizacje' : location}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sortuj: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((material) => {
          const stockPercentage = getStockPercentage(material.remaining, material.allocatedQuantity);
          const CategoryIcon = getCategoryIcon(material.category);
          
          return (
            <div
              key={material.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-elevation-medium transition-all"
            >
              {/* Material Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200">
                    <CategoryIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {material.name}
                    </h4>
                    <Badge variant="neutral" className="text-xs mb-1">
                      {material.category}
                    </Badge>
                    <p className="text-xs text-gray-500">{material.supplier}</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {material.currentStock} {material.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                      z {material.allocatedQuantity} {material.unit} przydzielonych
                    </p>
                  </div>
                  <div className="ml-3">
                    {getStockStatusBadge(material.stockStatus)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Stan magazynowy</span>
                    <span className="font-semibold text-gray-900">{stockPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        stockPercentage > 20 ? "bg-green-500" :
                        stockPercentage > 5 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.max(stockPercentage, 2)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Ostatnia dostawa</p>
                      <p className="font-semibold text-gray-900">{material.lastDeliveryDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Zużyto w miesiącu</p>
                      <p className="font-semibold text-gray-900">{material.usedThisMonth} {material.unit}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Pozostało</p>
                      <p className="font-semibold text-gray-900">{material.remaining} {material.unit}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Tempo zużycia</p>
                      <p className="font-semibold text-gray-900">~{material.burnRate}/tydzień</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 font-medium"
                  onClick={() => {}}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Zamów
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center justify-center gap-2 font-medium"
                  onClick={() => handleViewDetails(material)}
                >
                  <Eye className="h-4 w-4" />
                  Szczegóły
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Material Detail Modal */}
      {showDetailModal && selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </>
  );
};

export default ProjectMaterialsSubTab;