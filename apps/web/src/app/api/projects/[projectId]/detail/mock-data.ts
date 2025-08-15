// Mock data for project details
export const mockProjectDetails: any = {
  '1': {
    id: '1',
    name: 'Osiedle Słoneczne',
    address: 'ul. Warszawska 123, Kraków',
    developerId: 'dev1',
    developer: {
      id: 'dev1',
      name: 'Deweloper ABC',
      contact: 'Jan Nowak',
      email: 'kontakt@devabc.pl',
      phone: '+48 123 456 789'
    },
    coordinatorId: 'coord1',
    coordinator: {
      id: 'coord1',
      name: 'Jan Kowalski',
      email: 'j.kowalski@example.com',
      image: null,
      position: 'Kierownik Projektu'
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
    createdBy: {
      id: 'user1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    deletedAt: null,
    apartments: [
      {
        id: 'apt1',
        projectId: '1',
        number: 'A101',
        floor: 1,
        area: 65,
        rooms: 3,
        type: 'standard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        status: 'in_progress',
        progress: 45,
        assignedUser: {
          id: 'worker1',
          name: 'Piotr Nowak',
          image: null,
          position: 'Tynkarz'
        },
        tasksCompleted: 5,
        totalTasks: 11,
        tasks: []
      },
      {
        id: 'apt2',
        projectId: '1',
        number: 'A102',
        floor: 1,
        area: 52,
        rooms: 2,
        type: 'standard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        status: 'approved',
        progress: 100,
        assignedUser: {
          id: 'worker2',
          name: 'Tomasz Wiśniewski',
          image: null,
          position: 'Tynkarz'
        },
        tasksCompleted: 11,
        totalTasks: 11,
        tasks: []
      },
      {
        id: 'apt3',
        projectId: '1',
        number: 'A201',
        floor: 2,
        area: 78,
        rooms: 4,
        type: 'premium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        status: 'not_started',
        progress: 0,
        assignedUser: null,
        tasksCompleted: 0,
        totalTasks: 11,
        tasks: []
      }
    ],
    tasks: [],
    _count: {
      apartments: 48,
      tasks: 120
    },
    metrics: {
      totalValue: 348000,
      paidAmount: 156600,
      paymentProgress: 45,
      timeProgress: 72,
      completionProgress: 45,
      apartmentsCompleted: 22,
      tasksCompleted: 54,
      totalApartments: 48,
      totalTasks: 120
    }
  },
  '2': {
    id: '2',
    name: 'Apartamenty Zielone',
    address: 'ul. Zielona 45, Warszawa',
    developerId: 'dev2',
    developer: {
      id: 'dev2',
      name: 'Green Development',
      contact: 'Anna Zielona',
      email: 'info@greendev.pl',
      phone: '+48 987 654 321'
    },
    coordinatorId: 'coord2',
    coordinator: {
      id: 'coord2',
      name: 'Anna Nowak',
      email: 'a.nowak@example.com',
      image: null,
      position: 'Kierownik Projektu'
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
    createdBy: {
      id: 'user1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    deletedAt: null,
    apartments: [],
    tasks: [],
    _count: {
      apartments: 72,
      tasks: 180
    },
    metrics: {
      totalValue: 0,
      paidAmount: 0,
      paymentProgress: 0,
      timeProgress: 0,
      completionProgress: 0,
      apartmentsCompleted: 0,
      tasksCompleted: 0,
      totalApartments: 72,
      totalTasks: 180
    }
  },
  '3': {
    id: '3',
    name: 'Rezydencja Parkowa',
    address: 'ul. Parkowa 8, Gdańsk',
    developerId: 'dev3',
    developer: {
      id: 'dev3',
      name: 'Premium Estates',
      contact: 'Robert Premium',
      email: 'office@premiumestates.pl',
      phone: '+48 111 222 333'
    },
    coordinatorId: 'coord1',
    coordinator: {
      id: 'coord1',
      name: 'Jan Kowalski',
      email: 'j.kowalski@example.com',
      image: null,
      position: 'Kierownik Projektu'
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
    createdBy: {
      id: 'user1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    deletedAt: null,
    apartments: [],
    tasks: [],
    _count: {
      apartments: 36,
      tasks: 90
    },
    metrics: {
      totalValue: 356400,
      paidAmount: 285120,
      paymentProgress: 80,
      timeProgress: 92,
      completionProgress: 80,
      apartmentsCompleted: 29,
      tasksCompleted: 72,
      totalApartments: 36,
      totalTasks: 90
    }
  }
}

// Get default project detail if ID not found
export function getProjectDetail(projectId: string) {
  return mockProjectDetails[projectId] || {
    ...mockProjectDetails['1'],
    id: projectId,
    name: `Project ${projectId}`
  }
}