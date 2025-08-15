// Mock material orders data
export const mockMaterialOrders = [
  {
    id: 'order1',
    projectId: '1',
    orderNumber: 'ORD-2024-0001',
    orderDate: new Date('2024-01-15'),
    deliveryDate: new Date('2024-01-20'),
    supplier: 'BuildSupply Co.',
    status: 'DELIVERED',
    orderedById: 'user1',
    orderedBy: {
      name: 'Jan Kowalski',
      position: 'Kierownik Projektu'
    },
    totalAmount: 15000,
    items: [
      {
        materialName: 'Cement portlandzki CEM I 42,5R',
        quantity: 100,
        unit: 'worków',
        unitPrice: 25,
        totalPrice: 2500
      },
      {
        materialName: 'Płytki ceramiczne 60x60',
        quantity: 200,
        unit: 'm²',
        unitPrice: 60,
        totalPrice: 12000
      }
    ],
    deliveryStatus: 'delivered',
    priority: 'normal',
    notes: 'Dostawa na budowę A'
  },
  {
    id: 'order2',
    projectId: '1',
    orderNumber: 'ORD-2024-0002',
    orderDate: new Date('2024-02-01'),
    deliveryDate: new Date('2024-02-10'),
    supplier: 'CeramicWorld',
    status: 'IN_TRANSIT',
    orderedById: 'user2',
    orderedBy: {
      name: 'Anna Nowak',
      position: 'Specjalista ds. Zakupów'
    },
    totalAmount: 8500,
    items: [
      {
        materialName: 'Gładź gipsowa',
        quantity: 50,
        unit: 'worków',
        unitPrice: 30,
        totalPrice: 1500
      },
      {
        materialName: 'Klej do płytek',
        quantity: 100,
        unit: 'worków',
        unitPrice: 70,
        totalPrice: 7000
      }
    ],
    deliveryStatus: 'inTransit',
    priority: 'high',
    notes: 'Pilne - mieszkania A101-A110'
  },
  {
    id: 'order3',
    projectId: '1',
    orderNumber: 'ORD-2024-0003',
    orderDate: new Date('2024-02-15'),
    deliveryDate: new Date('2024-02-25'),
    supplier: 'Steel Solutions',
    status: 'PENDING',
    orderedById: 'user1',
    orderedBy: {
      name: 'Jan Kowalski',
      position: 'Kierownik Projektu'
    },
    totalAmount: 22000,
    items: [
      {
        materialName: 'Pręty zbrojeniowe fi 12',
        quantity: 2000,
        unit: 'kg',
        unitPrice: 4.5,
        totalPrice: 9000
      },
      {
        materialName: 'Siatka zbrojeniowa',
        quantity: 500,
        unit: 'm²',
        unitPrice: 26,
        totalPrice: 13000
      }
    ],
    deliveryStatus: 'pending',
    priority: 'normal',
    notes: 'Zamówienie na II etap'
  }
]

export function getMockOrdersByProject(projectId: string) {
  return mockMaterialOrders.filter(order => order.projectId === projectId)
}