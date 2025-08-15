'use client';

import { useState } from 'react';
import { X, Package, FileText, AlertTriangle, BarChart3, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

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

interface MaterialDetailModalProps {
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

const MaterialDetailModal = ({ material, isOpen, onClose }: MaterialDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'allocation' | 'usage' | 'history'>('info');

  const tabs = [
    { id: 'info' as const, label: 'Informacje', icon: FileText },
    { id: 'allocation' as const, label: 'Przydział', icon: Package },
    { id: 'usage' as const, label: 'Zużycie', icon: BarChart3 },
    { id: 'history' as const, label: 'Historia', icon: Calendar }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Szczegóły materiału" className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={material.imageUrl}
            alt={material.name}
            className="w-16 h-16 rounded-lg object-cover bg-gray-100"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{material.name}</h2>
            <p className="text-sm text-gray-600">{material.category} • {material.supplier}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pb-4 px-1 border-b-2 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'info' && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Specyfikacja techniczna</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Typ:</span> Cement wysokiej wytrzymałości</p>
                    <p className="text-sm"><span className="font-medium">Klasa:</span> CEM I 42,5R</p>
                    <p className="text-sm"><span className="font-medium">Norma:</span> PN-EN 197-1:2012</p>
                    <p className="text-sm"><span className="font-medium">Opakowanie:</span> Worek 25kg</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Informacje o dostawcy</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Firma:</span> {material.supplier}</p>
                    <p className="text-sm"><span className="font-medium">Kontakt:</span> +48 123 456 789</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> kontakt@buildsupply.pl</p>
                    <p className="text-sm"><span className="font-medium">Czas dostawy:</span> 2-3 dni robocze</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Wymagania przechowywania</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium">Lokalizacja:</span> Magazyn główny, sektor A</p>
                    <p className="text-sm"><span className="font-medium">Warunki:</span> Suche, przewiewne miejsce</p>
                    <p className="text-sm"><span className="font-medium">Temperatura:</span> 5-30°C</p>
                    <p className="text-sm"><span className="font-medium">Ważność:</span> 6 miesięcy od daty produkcji</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Informacje BHP</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">Środki ostrożności:</p>
                        <ul className="mt-1 space-y-1 text-amber-700">
                          <li>• Używać rękawic ochronnych</li>
                          <li>• Unikać kontaktu z oczami</li>
                          <li>• Stosować maskę przeciwpyłową</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'allocation' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Przydział projektu</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Całkowity przydział</p>
                  <p className="text-2xl font-bold text-gray-900">{material.allocatedQuantity} {material.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Planowane zużycie miesięczne</p>
                  <p className="text-2xl font-bold text-gray-900">60 {material.unit}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Harmonogram dostaw</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Dostawa #1</p>
                      <p className="text-sm text-gray-600">50 worków</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Zrealizowana</p>
                    <p className="text-xs text-gray-500">15.04.2024</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Dostawa #2</p>
                      <p className="text-sm text-gray-600">50 worków</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">Planowana</p>
                    <p className="text-xs text-gray-500">30.04.2024</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Dostawa #3</p>
                      <p className="text-sm text-gray-600">50 worków</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Planowana</p>
                    <p className="text-xs text-gray-500">15.05.2024</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Fazy projektu wymagające materiału</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Fundamenty</span>
                  <Badge variant="neutral">30 worków</Badge>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Ściany nośne</span>
                  <Badge variant="neutral">60 worków</Badge>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Stropy</span>
                  <Badge variant="neutral">40 worków</Badge>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Wykończenia</span>
                  <Badge variant="neutral">20 worków</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Statystyki zużycia</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ten miesiąc</p>
                  <p className="text-2xl font-bold text-gray-900">{material.usedThisMonth} {material.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Średnie tempo</p>
                  <p className="text-2xl font-bold text-gray-900">{material.burnRate} {material.unit}/tydzień</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Efektywność</p>
                  <p className="text-2xl font-bold text-green-600">92%</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Analiza zużycia vs plan</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Faktyczne zużycie</span>
                    <span className="font-medium">{material.usedThisMonth} {material.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Planowane zużycie</span>
                    <span className="font-medium">60 {material.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">
                Zużycie o 25% niższe niż planowane - dobra efektywność
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Śledzenie odpadów</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-900">Odpad materiałowy</p>
                    <p className="text-sm text-amber-700 mt-1">3 worki (6% całkowitego zużycia)</p>
                  </div>
                  <Badge variant="warning">Wymaga uwagi</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-amber-700">
                  <p>• 2 worki - uszkodzone opakowanie</p>
                  <p>• 1 worek - zawilgocenie podczas przechowywania</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Historia operacji</h3>
            <div className="space-y-2">
              {[
                { date: '20.04.2024', action: 'Zużycie', amount: '-5 worków', user: 'Jan Kowalski', note: 'Betonowanie fundamentów B3' },
                { date: '18.04.2024', action: 'Zużycie', amount: '-8 worków', user: 'Piotr Nowak', note: 'Ściany nośne - parter' },
                { date: '15.04.2024', action: 'Dostawa', amount: '+50 worków', user: 'System', note: 'Dostawa #1 - BuildSupply Co.' },
                { date: '12.04.2024', action: 'Zużycie', amount: '-12 worków', user: 'Jan Kowalski', note: 'Fundamenty A1-A4' },
                { date: '10.04.2024', action: 'Korekta', amount: '+2 worki', user: 'Admin', note: 'Korekta inwentaryzacji' },
              ].map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      entry.action === 'Dostawa' ? "bg-green-500" :
                      entry.action === 'Zużycie' ? "bg-blue-500" :
                      "bg-gray-500"
                    )} />
                    <div>
                      <p className="font-medium text-sm">{entry.action}</p>
                      <p className="text-sm text-gray-600">{entry.user} • {entry.note}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-medium",
                      entry.amount.startsWith('+') ? "text-green-600" : "text-red-600"
                    )}>
                      {entry.amount}
                    </p>
                    <p className="text-xs text-gray-500">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onClose}>
          Zamknij
        </Button>
        <Button variant="primary">
          Zamów materiał
        </Button>
      </div>
    </Modal>
  );
};

export default MaterialDetailModal;