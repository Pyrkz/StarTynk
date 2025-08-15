// Mock data for projects demo
export const mockProjects = [
  {
    id: '1',
    name: 'Osiedle Słoneczne',
    address: 'ul. Warszawska 123, Kraków',
    developerId: 'dev1',
    developer: {
      id: 'dev1',
      name: 'Deweloper ABC'
    },
    coordinatorId: 'coord1',
    coordinator: {
      id: 'coord1', 
      name: 'Jan Kowalski'
    },
    status: 'IN_PROGRESS',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    apartmentCount: 48,
    description: 'Nowoczesne osiedle mieszkaniowe',
    baseRate: 85,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdById: 'user1',
    deletedAt: null,
    _count: {
      apartments: 48,
      tasks: 120
    }
  },
  {
    id: '2',
    name: 'Apartamenty Zielone',
    address: 'ul. Zielona 45, Warszawa',
    developerId: 'dev2',
    developer: {
      id: 'dev2',
      name: 'Green Development'
    },
    coordinatorId: 'coord2',
    coordinator: {
      id: 'coord2',
      name: 'Anna Nowak'
    },
    status: 'PLANNING',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-06-30'),
    apartmentCount: 72,
    description: 'Ekskluzywne apartamenty w centrum miasta',
    baseRate: 95,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    createdById: 'user1',
    deletedAt: null,
    _count: {
      apartments: 72,
      tasks: 180
    }
  },
  {
    id: '3',
    name: 'Rezydencja Parkowa',
    address: 'ul. Parkowa 8, Gdańsk',
    developerId: 'dev3',
    developer: {
      id: 'dev3',
      name: 'Premium Estates'
    },
    coordinatorId: 'coord1',
    coordinator: {
      id: 'coord1',
      name: 'Jan Kowalski'
    },
    status: 'IN_PROGRESS',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-08-31'),
    apartmentCount: 36,
    description: 'Luksusowa rezydencja z widokiem na park',
    baseRate: 110,
    isActive: true,
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-08-01'),
    createdById: 'user1',
    deletedAt: null,
    _count: {
      apartments: 36,
      tasks: 90
    }
  }
]