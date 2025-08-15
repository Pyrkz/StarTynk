'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { 
  EquipmentWithRelations, 
  EquipmentHistoryEntry,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  HISTORY_ACTION_LABELS
} from '@/features/equipment/types/equipment.types';

interface EquipmentDetailResponse {
  equipment: EquipmentWithRelations;
  history: EquipmentHistoryEntry[];
}

// Equipment Information Panel
function EquipmentInfoPanel({ equipment }: { equipment: EquipmentWithRelations }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {equipment.imageUrl ? (
              <img 
                src={equipment.imageUrl} 
                alt={equipment.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <span className="text-gray-400 text-2xl">🔧</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-600">{equipment.category.name}</p>
            <div className="mt-2">
              <Badge 
                variant={
                  equipment.status === 'AVAILABLE' ? 'success' :
                  equipment.status === 'ASSIGNED' ? 'primary' :
                  equipment.status === 'DAMAGED' ? 'error' : 'neutral'
                }
              >
                {EQUIPMENT_STATUS_LABELS[equipment.status]}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {equipment.status === 'AVAILABLE' && (
            <Button size="sm">
              Wydaj sprzęt
            </Button>
          )}
          {equipment.status === 'ASSIGNED' && (
            <Button size="sm" variant="outline">
              Zwróć sprzęt
            </Button>
          )}
          <Button size="sm" variant="outline">
            Edytuj
          </Button>
        </div>
      </div>

      {/* Basic Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Podstawowe informacje</h3>
          <div className="space-y-3">
            {equipment.serialNumber && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Numer seryjny</dt>
                <dd className="text-sm text-gray-900">{equipment.serialNumber}</dd>
              </div>
            )}
            {equipment.condition && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Stan techniczny</dt>
                <dd className="text-sm text-gray-900 capitalize">{equipment.condition}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500">Data utworzenia</dt>
              <dd className="text-sm text-gray-900">
                {new Date(equipment.createdAt).toLocaleDateString('pl-PL')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Ostatnia aktualizacja</dt>
              <dd className="text-sm text-gray-900">
                {new Date(equipment.updatedAt).toLocaleDateString('pl-PL')}
              </dd>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Zakup i wartość</h3>
          <div className="space-y-3">
            {equipment.purchaseDate && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Data zakupu</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(equipment.purchaseDate).toLocaleDateString('pl-PL')}
                </dd>
              </div>
            )}
            {equipment.purchasePrice && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Cena zakupu</dt>
                <dd className="text-sm text-gray-900">
                  {new Intl.NumberFormat('pl-PL', {
                    style: 'currency',
                    currency: 'PLN'
                  }).format(Number(equipment.purchasePrice))}
                </dd>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Aktualny status</h3>
          <div className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd>
                <Badge 
                  variant={
                    equipment.status === 'AVAILABLE' ? 'success' :
                    equipment.status === 'ASSIGNED' ? 'primary' :
                    equipment.status === 'DAMAGED' ? 'error' : 'neutral'
                  }
                >
                  {EQUIPMENT_STATUS_LABELS[equipment.status]}
                </Badge>
              </dd>
            </div>
            
            {/* Current Assignment */}
            {equipment.status === 'ASSIGNED' && equipment.assignments.length > 0 && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Przypisany do</dt>
                <dd className="text-sm text-gray-900">
                  {equipment.assignments[0].user.name}
                </dd>
                <dd className="text-xs text-gray-500">
                  od {new Date(equipment.assignments[0].assignedDate).toLocaleDateString('pl-PL')}
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {equipment.description && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Opis</h3>
          <p className="text-sm text-gray-900">{equipment.description}</p>
        </div>
      )}
    </div>
  );
}

// Equipment History Timeline
function EquipmentHistory({ history }: { history: EquipmentHistoryEntry[] }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Historia sprzętu</h2>
      
      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Brak historii dla tego sprzętu</p>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {history.map((entry, entryIdx) => (
              <li key={entry.id}>
                <div className="relative pb-8">
                  {entryIdx !== history.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        entry.action === 'ASSIGNED' ? 'bg-blue-500' :
                        entry.action === 'RETURNED' ? 'bg-green-500' :
                        entry.action === 'DAMAGED' ? 'bg-red-500' :
                        entry.action === 'REPAIRED' ? 'bg-yellow-500' :
                        entry.action === 'PURCHASED' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}>
                        <span className="text-white text-xs">
                          {entry.action === 'ASSIGNED' ? '📤' :
                           entry.action === 'RETURNED' ? '📥' :
                           entry.action === 'DAMAGED' ? '⚠️' :
                           entry.action === 'REPAIRED' ? '🔧' :
                           entry.action === 'PURCHASED' ? '🛒' :
                           '📋'}
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {HISTORY_ACTION_LABELS[entry.action]}
                          {entry.userName && (
                            <span className="text-gray-500"> - {entry.userName}</span>
                          )}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-gray-500">{entry.description}</p>
                        )}
                        {entry.details && (
                          <div className="text-xs text-gray-400 mt-1">
                            {entry.details.assignedTo && (
                              <span>Przypisano do: {entry.details.assignedTo}</span>
                            )}
                            {entry.details.location && (
                              <span>Lokalizacja: {entry.details.location}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time>{new Date(entry.actionDate).toLocaleDateString('pl-PL')}</time>
                        <div className="text-xs">
                          {new Date(entry.actionDate).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentWithRelations | null>(null);
  const [history, setHistory] = useState<EquipmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const fetchEquipmentDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/equipment/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Nie znaleziono sprzętu');
          } else {
            setError('Błąd podczas ładowania danych');
          }
          return;
        }

        const data: EquipmentDetailResponse = await response.json();
        setEquipment(data.equipment);
        setHistory(data.history);
      } catch (err) {
        console.error('Error fetching equipment detail:', err);
        setError('Błąd podczas ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEquipmentDetail();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Błąd</h3>
          <div className="mt-2 text-sm text-red-700">{error}</div>
          <div className="mt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
            >
              Wróć
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">❓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nie znaleziono sprzętu
          </h3>
          <p className="text-gray-500 mb-4">
            Sprzęt o podanym ID nie istnieje lub został usunięty.
          </p>
          <Button
            onClick={() => router.push('/dashboard/magazyn')}
            variant="outline"
          >
            Wróć do magazynu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => router.push('/dashboard/magazyn')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Magazyn
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <button
                onClick={() => router.push(`/dashboard/magazyn/${equipment.category.id}`)}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
              >
                {equipment.category.name}
              </button>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {equipment.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Equipment Information */}
        <EquipmentInfoPanel equipment={equipment} />

        {/* Equipment History */}
        <EquipmentHistory history={history} />
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Wydaj sprzęt"
        >
          <div className="p-4">
            <p>Formularz wydania sprzętu będzie tutaj...</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                onClick={() => setShowAssignModal(false)}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button>
                Wydaj
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <Modal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          title="Zwróć sprzęt"
        >
          <div className="p-4">
            <p>Formularz zwrotu sprzętu będzie tutaj...</p>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                onClick={() => setShowReturnModal(false)}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button>
                Zwróć
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}