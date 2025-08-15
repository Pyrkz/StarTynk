import { useState, useEffect } from 'react';
import { 
  MockCategory, 
  DetailedEquipmentItem, 
  AssignmentHistoryEntry, 
  MaintenanceHistoryEntry,
  EquipmentStats
} from '@/features/equipment/types/equipment.types';

// Generate realistic mock data
const generateMockEquipmentData = (): MockCategory[] => {
  const categories: MockCategory[] = [
    {
      id: 'dalmierze',
      name: 'Dalmierze',
      icon: '📐',
      description: 'Elektroniczne dalmierze laserowe do precyzyjnych pomiarów',
      totalCount: 20,
      availableCount: 12,
      assignedCount: 6,
      damagedCount: 2,
      equipmentList: []
    },
    {
      id: 'kaski-ochronne',
      name: 'Kaski ochronne',
      icon: '⛑️',
      description: 'Kaski BHP do prac budowlanych i robót wysokościowych',
      totalCount: 10,
      availableCount: 7,
      assignedCount: 3,
      damagedCount: 0,
      equipmentList: []
    },
    {
      id: 'wiertarki',
      name: 'Wiertarki',
      icon: '🔧',
      description: 'Wiertarki udarowe i bezudarowe różnych mocy',
      totalCount: 15,
      availableCount: 9,
      assignedCount: 4,
      damagedCount: 2,
      equipmentList: []
    },
    {
      id: 'poziomica',
      name: 'Poziomica',
      icon: '📏',
      description: 'Poziomica budowlane różnych długości i precyzji',
      totalCount: 8,
      availableCount: 5,
      assignedCount: 2,
      damagedCount: 1,
      equipmentList: []
    },
    {
      id: 'agregaty',
      name: 'Agregaty spawalnicze',
      icon: '⚡',
      description: 'Przenośne agregaty spawalnicze różnych typów',
      totalCount: 5,
      availableCount: 3,
      assignedCount: 2,
      damagedCount: 0,
      equipmentList: []
    },
    {
      id: 'elektronarzedzia',
      name: 'Elektronarzędzia',
      icon: '🔌',
      description: 'Różnorodne elektronarzędzia budowlane i warsztatowe',
      totalCount: 25,
      availableCount: 18,
      assignedCount: 5,
      damagedCount: 2,
      equipmentList: []
    },
    {
      id: 'ladowarki',
      name: 'Ładowarki kołowe',
      icon: '🚜',
      description: 'Ładowarki kołowe i gąsienicowe do robót ziemnych',
      totalCount: 3,
      availableCount: 1,
      assignedCount: 2,
      damagedCount: 0,
      equipmentList: []
    },
    {
      id: 'rusztowania',
      name: 'Rusztowania',
      icon: '🏗️',
      description: 'Elementy rusztowań systemowych i tradycyjnych',
      totalCount: 100,
      availableCount: 65,
      assignedCount: 30,
      damagedCount: 5,
      equipmentList: []
    }
  ];

  // Generate detailed equipment items for each category
  categories.forEach(category => {
    category.equipmentList = generateEquipmentForCategory(category);
  });

  return categories;
};

const generateEquipmentForCategory = (category: MockCategory): DetailedEquipmentItem[] => {
  const equipment: DetailedEquipmentItem[] = [];
  const equipmentNames = getEquipmentNamesForCategory(category.id);
  
  for (let i = 0; i < category.totalCount; i++) {
    const randomName = equipmentNames[i % equipmentNames.length];
    const status = getRandomStatus(category, i);
    
    const item: DetailedEquipmentItem = {
      id: `${category.id}-${String(i + 1).padStart(3, '0')}`,
      categoryId: category.id,
      name: `${randomName} ${i + 1}`,
      model: getRandomModel(category.id),
      serialNumber: `${category.id.toUpperCase().substring(0, 3)}${(i + 1).toString().padStart(4, '0')}`,
      status,
      condition: getRandomCondition(status),
      purchaseDate: getRandomPurchaseDate(),
      purchasePrice: getRandomPrice(category.id),
      location: getRandomLocation(),
      lastActivity: getRandomLastActivity(),
      assignmentHistory: generateAssignmentHistory(),
      maintenanceHistory: generateMaintenanceHistory()
    };

    // Add current assignment if status is ASSIGNED
    if (status === 'ASSIGNED') {
      item.currentAssignment = {
        employeeId: `emp-${Math.floor(Math.random() * 100) + 1}`,
        employeeName: getRandomEmployeeName(),
        assignedDate: getRandomAssignmentDate(),
        expectedReturnDate: getRandomExpectedReturn(),
        project: getRandomProject(),
        notes: getRandomAssignmentNotes()
      };
    }

    equipment.push(item);
  }

  return equipment;
};

const getEquipmentNamesForCategory = (categoryId: string): string[] => {
  const nameMap: Record<string, string[]> = {
    'dalmierze': [
      'Bosch GLM 80', 'Leica DISTO D2', 'Stanley TLM99', 'Makita LD050P',
      'Bosch GLM 50', 'Leica DISTO X3', 'DeWALT DW088K', 'Stabila LD 520'
    ],
    'kaski-ochronne': [
      'UVEX Pheos B', '3M SecureFit X5000', 'MSA V-Gard', 'Honeywell Peak A79R',
      'UVEX Uvicap', 'JSP EVO2', 'Delta Plus Diamond V', 'Schuberth Baumeister'
    ],
    'wiertarki': [
      'Bosch GSB 13 RE', 'Makita HP2050H', 'DeWALT DWD024', 'Hilti TE 2-A22',
      'Metabo SBE 650', 'Black+Decker BEH710', 'AEG SBE 705 RE', 'Ryobi RPD800-K'
    ],
    'poziomica': [
      'Stabila 70-2', 'Stanley FATMAX', 'Bosch Professional GIM 60', 'SOLA AZ3',
      'Stabila 96-2', 'BMI Eurostar', 'Kapro Spirit Level', 'Stabila R-Type'
    ],
    'agregaty': [
      'Lincoln Invertec V160-T', 'ESAB Buddy Arc 180', 'Kemppi MinarcMig Evo 170',
      'Fronius TransPocket 180', 'Telwin Tecnica 171/S'
    ],
    'elektronarzedzia': [
      'Bosch GWS 7-115', 'Makita 9558HN', 'DeWALT DCS391N', 'Hilti WSR 36-A',
      'Metabo W 9-115', 'Black+Decker CS1250L', 'AEG BEWS 18-115', 'Ryobi R18CS-0'
    ],
    'ladowarki': [
      'Caterpillar 906M', 'JCB 411 HT', 'Komatsu WA200'
    ],
    'rusztowania': [
      'Rama H 2.0m', 'Podest stalowy 3.0m', 'Stojak regulowany', 'Klin blokujący',
      'Poprzeczka 1.5m', 'Kotwa ścienna', 'Element narożny', 'Kółko transportowe'
    ]
  };

  return nameMap[categoryId] || ['Element standardowy', 'Urządzenie podstawowe'];
};

const getRandomStatus = (category: MockCategory, index: number) => {
  const { availableCount, assignedCount, damagedCount } = category;
  const total = availableCount + assignedCount + damagedCount;
  
  if (index < availableCount) return 'AVAILABLE';
  if (index < availableCount + assignedCount) return 'ASSIGNED';
  if (index < total) return 'DAMAGED';
  return 'RETIRED';
};

const getRandomCondition = (status: string) => {
  if (status === 'DAMAGED') return 'damaged';
  
  const conditions = ['excellent', 'good', 'fair', 'poor'];
  const weights = [0.3, 0.4, 0.2, 0.1]; // More items in good condition
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < conditions.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return conditions[i];
    }
  }
  
  return 'good';
};

const getRandomModel = (categoryId: string): string => {
  const modelMap: Record<string, string[]> = {
    'dalmierze': ['GLM80', 'DISTO-D2', 'TLM99', 'LD050P'],
    'kaski-ochronne': ['PHEOS-B', 'X5000', 'VGARD-H1', 'A79R'],
    'wiertarki': ['GSB13RE', 'HP2050H', 'DWD024', 'TE2A22'],
    'poziomica': ['70-2', 'FATMAX-43', 'GIM60', 'AZ3-60'],
    'agregaty': ['V160T', 'ARC180', 'EVO170', 'TP180'],
    'elektronarzedzia': ['GWS7-115', '9558HN', 'DCS391N', 'WSR36A'],
    'ladowarki': ['906M', '411HT', 'WA200'],
    'rusztowania': ['H-200', 'PODEST-300', 'REG-STD', 'KLIN-BLK']
  };

  const models = modelMap[categoryId] || ['STD-MODEL'];
  return models[Math.floor(Math.random() * models.length)];
};

const getRandomPrice = (categoryId: string): number => {
  const priceRanges: Record<string, [number, number]> = {
    'dalmierze': [300, 800],
    'kaski-ochronne': [50, 150],
    'wiertarki': [150, 500],
    'poziomica': [80, 200],
    'agregaty': [1500, 4000],
    'elektronarzedzia': [100, 400],
    'ladowarki': [150000, 300000],
    'rusztowania': [25, 100]
  };

  const [min, max] = priceRanges[categoryId] || [100, 500];
  return Math.floor(Math.random() * (max - min) + min);
};

const getRandomPurchaseDate = (): string => {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
};

const getRandomLocation = (): string => {
  const locations = [
    'Magazyn główny - Sektor A',
    'Magazyn główny - Sektor B',
    'Magazyn główny - Sektor C',
    'Magazyn terrenowy - Warszawa',
    'Magazyn terrenowy - Kraków',
    'Plac budowy - ul. Słoneczna',
    'Plac budowy - ul. Kwiatowa',
    'Serwis zewnętrzny',
    'Transport - pojazd T001',
    'Biuro terenowe'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

const getRandomLastActivity = (): string => {
  const days = Math.floor(Math.random() * 30) + 1;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const getRandomEmployeeName = (): string => {
  const names = [
    'Jan Kowalski', 'Anna Nowak', 'Piotr Wiśniewski', 'Maria Wójcik',
    'Tomasz Kowalczyk', 'Katarzyna Kamińska', 'Andrzej Lewandowski',
    'Agnieszka Zielińska', 'Krzysztof Woźniak', 'Barbara Dąbrowska',
    'Marek Kozłowski', 'Ewa Jankowska', 'Michał Mazur', 'Joanna Kwiatkowska'
  ];
  return names[Math.floor(Math.random() * names.length)];
};

const getRandomAssignmentDate = (): string => {
  const days = Math.floor(Math.random() * 60) + 1;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const getRandomExpectedReturn = (): string => {
  const days = Math.floor(Math.random() * 30) + 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const getRandomProject = (): string => {
  const projects = [
    'Budowa A-15', 'Remont M-20', 'Projekt Słoneczny',
    'Inwestycja Centrum', 'Modernizacja B-12', 'Budowa Magazynu',
    'Remont Biura', 'Projekt Zielony', 'Rozbudowa Hali'
  ];
  return projects[Math.floor(Math.random() * projects.length)];
};

const getRandomAssignmentNotes = (): string => {
  const notes = [
    'Do pomiaru pomieszczeń',
    'Prace wysokościowe',
    'Roboty wykończeniowe',
    'Montaż konstrukcji',
    'Prace izolacyjne',
    'Instalacje elektryczne',
    'Roboty ziemne',
    'Prace spawalnicze',
    'Konserwacja obiektów'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
};

const generateAssignmentHistory = (): AssignmentHistoryEntry[] => {
  const historyCount = Math.floor(Math.random() * 5) + 1;
  const history: AssignmentHistoryEntry[] = [];
  
  for (let i = 0; i < historyCount; i++) {
    const assignedDate = new Date();
    assignedDate.setDate(assignedDate.getDate() - (i + 1) * 60);
    
    const returnDate = new Date(assignedDate);
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 30) + 7);
    
    const duration = Math.ceil((returnDate.getTime() - assignedDate.getTime()) / (1000 * 3600 * 24));
    
    history.push({
      id: `assign-${i + 1}`,
      employeeName: getRandomEmployeeName(),
      employeeId: `emp-${Math.floor(Math.random() * 100) + 1}`,
      assignedDate: assignedDate.toISOString().split('T')[0],
      returnDate: i === 0 ? undefined : returnDate.toISOString().split('T')[0],
      duration: i === 0 ? undefined : duration,
      project: getRandomProject(),
      notes: getRandomAssignmentNotes(),
      returnCondition: i === 0 ? undefined : getRandomCondition('AVAILABLE')
    });
  }
  
  return history.reverse(); // Most recent first
};

const generateMaintenanceHistory = (): MaintenanceHistoryEntry[] => {
  const maintenanceCount = Math.floor(Math.random() * 3) + 1;
  const history: MaintenanceHistoryEntry[] = [];
  const maintenanceTypes = ['inspection', 'repair', 'service', 'calibration'] as const;
  
  for (let i = 0; i < maintenanceCount; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i + 1) * 90);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 180);
    
    const type = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    
    history.push({
      id: `maint-${i + 1}`,
      type,
      date: date.toISOString().split('T')[0],
      description: getMaintenanceDescription(type),
      cost: Math.floor(Math.random() * 200) + 50,
      serviceProvider: getRandomServiceProvider(),
      nextDueDate: nextDate.toISOString().split('T')[0],
      notes: getRandomMaintenanceNotes()
    });
  }
  
  return history.reverse(); // Most recent first
};

const getMaintenanceDescription = (type: string): string => {
  const descriptions: Record<string, string[]> = {
    inspection: ['Przegląd techniczny', 'Kontrola stanu technicznego', 'Inspekcja okresowa'],
    repair: ['Naprawa usterki', 'Wymiana części', 'Przywrócenie sprawności'],
    service: ['Serwis okresowy', 'Wymiana oleju', 'Czyszczenie i konserwacja'],
    calibration: ['Kalibracja urządzenia', 'Sprawdzenie dokładności', 'Regulacja parametrów']
  };
  
  const typeDescriptions = descriptions[type] || ['Czynności serwisowe'];
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
};

const getRandomServiceProvider = (): string => {
  const providers = [
    'Serwis Bosch', 'Autoryzowany Serwis Makita', 'TechService Sp. z o.o.',
    'ProSerwis Narzędzi', 'Centrum Serwisowe DeWALT', 'Serwis Zewnętrzny',
    'Własny zespół techniczny', 'Hilti Service Center'
  ];
  return providers[Math.floor(Math.random() * providers.length)];
};

const getRandomMaintenanceNotes = (): string => {
  const notes = [
    'Urządzenie w pełni sprawne',
    'Wymienione zużyte części',
    'Zalecana kontrola za 6 miesięcy',
    'Wymagana dodatkowa konserwacja',
    'Stan bardzo dobry',
    'Drobne ślady użytkowania',
    'Przeprowadzono pełny serwis'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
};

// Main hook
export const useMockEquipmentData = () => {
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      const mockData = generateMockEquipmentData();
      setCategories(mockData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getOverallStats = (): EquipmentStats => {
    const totals = categories.reduce(
      (acc, category) => ({
        total: acc.total + category.totalCount,
        available: acc.available + category.availableCount,
        assigned: acc.assigned + category.assignedCount,
        damaged: acc.damaged + category.damagedCount,
        retired: acc.retired + (category.totalCount - category.availableCount - category.assignedCount - category.damagedCount)
      }),
      { total: 0, available: 0, assigned: 0, damaged: 0, retired: 0 }
    );

    return {
      ...totals,
      utilizationRate: totals.total > 0 ? (totals.assigned / totals.total) * 100 : 0,
      maintenanceRequired: Math.floor(totals.total * 0.1) // 10% needs maintenance
    };
  };

  const getCategoryById = (categoryId: string): MockCategory | undefined => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getEquipmentById = (equipmentId: string): DetailedEquipmentItem | undefined => {
    for (const category of categories) {
      const equipment = category.equipmentList.find(item => item.id === equipmentId);
      if (equipment) return equipment;
    }
    return undefined;
  };

  const searchEquipment = (query: string): DetailedEquipmentItem[] => {
    const results: DetailedEquipmentItem[] = [];
    const searchTerm = query.toLowerCase();
    
    categories.forEach(category => {
      category.equipmentList.forEach(item => {
        if (
          item.name.toLowerCase().includes(searchTerm) ||
          item.serialNumber.toLowerCase().includes(searchTerm) ||
          item.model?.toLowerCase().includes(searchTerm) ||
          category.name.toLowerCase().includes(searchTerm)
        ) {
          results.push(item);
        }
      });
    });
    
    return results;
  };

  return {
    categories,
    loading,
    getOverallStats,
    getCategoryById,
    getEquipmentById,
    searchEquipment
  };
};