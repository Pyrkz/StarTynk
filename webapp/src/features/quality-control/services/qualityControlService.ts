import type { 
  QualityControl, 
  QualityControlStats, 
  QualityFilters, 
  SortConfig 
} from '../types'

interface FetchQualityControlsParams {
  filters: QualityFilters
  sort: SortConfig
  page?: number
  limit?: number
}

class QualityControlService {
  private baseUrl = '/api/quality-control'

  async fetchQualityControls(params: FetchQualityControlsParams): Promise<{
    data: QualityControl[]
    total: number
    page: number
    totalPages: number
  }> {
    // In production, this would be an actual API call
    // For now, returning mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: this.getMockQualityControls(),
          total: 45,
          page: 1,
          totalPages: 5
        })
      }, 800)
    })
  }

  async fetchQualityStats(): Promise<QualityControlStats> {
    // In production, this would be an actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getMockStats())
      }, 600)
    })
  }

  async updateQualityControl(
    id: string, 
    updates: Partial<QualityControl>
  ): Promise<QualityControl> {
    // API call to update quality control
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    return response.json()
  }

  async approveQualityControl(id: string, score: number): Promise<QualityControl> {
    return this.updateQualityControl(id, {
      status: 'APPROVED',
      qualityScore: score
    })
  }

  async rejectQualityControl(
    id: string, 
    reason: string, 
    corrections: string
  ): Promise<QualityControl> {
    return this.updateQualityControl(id, {
      status: 'REJECTED',
      issuesFound: reason,
      correctionsNeeded: corrections
    })
  }

  // Mock data methods
  private getMockQualityControls(): QualityControl[] {
    return [
      {
        id: '1',
        taskId: 'TSK-2024-001',
        controllerId: 'ctrl-1',
        controlNumber: 1,
        status: 'PENDING',
        completionRate: 80,
        qualityScore: 0,
        reportedArea: 125.5,
        correctedArea: 125.5,
        reportedLength: 45.2,
        correctedLength: 45.2,
        notes: '',
        controlDate: new Date('2024-01-15T10:30:00'),
        isActive: true,
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00'),
        priority: 'HIGH',
        task: {
          id: 'TSK-2024-001',
          title: 'Glazura łazienka - Apartament 12',
          projectId: 'proj-1',
          project: {
            name: 'Osiedle Słoneczne - Budynek A',
            location: 'Warszawa, Mokotów',
            client: 'Deweloper XYZ'
          },
          assignments: [{
            user: {
              id: 'user-1',
              name: 'Jan Kowalski',
              avatar: 'https://ui-avatars.com/api/?name=Jan+Kowalski'
            }
          }],
          dueDate: new Date('2024-01-20')
        },
        controller: {
          id: 'ctrl-1',
          name: 'Anna Nowak',
          role: 'Kierownik Jakości',
          avatar: 'https://ui-avatars.com/api/?name=Anna+Nowak'
        },
        history: [],
        photos: []
      },
      {
        id: '2',
        taskId: 'TSK-2024-002',
        controllerId: 'ctrl-1',
        controlNumber: 1,
        status: 'APPROVED',
        completionRate: 100,
        qualityScore: 95,
        reportedArea: 87.3,
        correctedArea: 87.3,
        reportedLength: 32.1,
        correctedLength: 32.1,
        notes: 'Wykonanie zgodne z projektem. Bardzo dobra jakość pracy.',
        controlDate: new Date('2024-01-14T14:20:00'),
        isActive: true,
        createdAt: new Date('2024-01-14T14:20:00'),
        updatedAt: new Date('2024-01-14T16:45:00'),
        priority: 'MEDIUM',
        task: {
          id: 'TSK-2024-002',
          title: 'Tynki wewnętrzne - Apartament 8',
          projectId: 'proj-1',
          project: {
            name: 'Osiedle Słoneczne - Budynek A',
            location: 'Warszawa, Mokotów',
            client: 'Deweloper XYZ'
          },
          assignments: [{
            user: {
              id: 'user-2',
              name: 'Piotr Wiśniewski',
              avatar: 'https://ui-avatars.com/api/?name=Piotr+Wiśniewski'
            }
          }],
          dueDate: new Date('2024-01-18')
        },
        controller: {
          id: 'ctrl-1',
          name: 'Anna Nowak',
          role: 'Kierownik Jakości',
          avatar: 'https://ui-avatars.com/api/?name=Anna+Nowak'
        },
        history: [
          {
            id: 'hist-1',
            action: 'Zatwierdzono kontrolę jakości',
            timestamp: new Date('2024-01-14T16:45:00'),
            user: { id: 'ctrl-1', name: 'Anna Nowak' }
          }
        ],
        photos: []
      },
      {
        id: '3',
        taskId: 'TSK-2024-003',
        controllerId: 'ctrl-2',
        controlNumber: 1,
        status: 'REJECTED',
        completionRate: 50,
        qualityScore: 45,
        reportedArea: 156.8,
        correctedArea: 140.2,
        reportedLength: 58.4,
        correctedLength: 52.1,
        notes: 'Nierówności na powierzchni, wymaga poprawek',
        issuesFound: 'Widoczne nierówności tynku, pęknięcia w narożnikach',
        correctionsNeeded: 'Szpachlowanie i wyrównanie powierzchni, naprawa pęknięć',
        controlDate: new Date('2024-01-13T09:15:00'),
        isActive: true,
        createdAt: new Date('2024-01-13T09:15:00'),
        updatedAt: new Date('2024-01-13T11:30:00'),
        priority: 'URGENT',
        task: {
          id: 'TSK-2024-003',
          title: 'Gładzie gipsowe - Apartament 15',
          projectId: 'proj-2',
          project: {
            name: 'Osiedle Zielone - Budynek B',
            location: 'Kraków, Bronowice',
            client: 'Inwestor ABC'
          },
          assignments: [{
            user: {
              id: 'user-3',
              name: 'Marek Dąbrowski',
              avatar: 'https://ui-avatars.com/api/?name=Marek+Dąbrowski'
            }
          }],
          dueDate: new Date('2024-01-16')
        },
        controller: {
          id: 'ctrl-2',
          name: 'Tomasz Król',
          role: 'Inspektor Jakości',
          avatar: 'https://ui-avatars.com/api/?name=Tomasz+Król'
        },
        history: [
          {
            id: 'hist-2',
            action: 'Odrzucono kontrolę jakości',
            timestamp: new Date('2024-01-13T11:30:00'),
            user: { id: 'ctrl-2', name: 'Tomasz Król' }
          }
        ],
        photos: []
      },
      {
        id: '4',
        taskId: 'TSK-2024-004',
        controllerId: 'ctrl-1',
        controlNumber: 1,
        status: 'IN_REVIEW',
        completionRate: 70,
        qualityScore: 0,
        reportedArea: 210.5,
        correctedArea: 210.5,
        reportedLength: 85.3,
        correctedLength: 85.3,
        notes: 'W trakcie szczegółowej kontroli',
        controlDate: new Date('2024-01-15T15:00:00'),
        isActive: true,
        createdAt: new Date('2024-01-15T15:00:00'),
        updatedAt: new Date('2024-01-15T15:00:00'),
        priority: 'MEDIUM',
        task: {
          id: 'TSK-2024-004',
          title: 'Malowanie ścian - Apartament 20',
          projectId: 'proj-1',
          project: {
            name: 'Osiedle Słoneczne - Budynek A',
            location: 'Warszawa, Mokotów',
            client: 'Deweloper XYZ'
          },
          assignments: [{
            user: {
              id: 'user-4',
              name: 'Katarzyna Zielińska',
              avatar: 'https://ui-avatars.com/api/?name=Katarzyna+Zielińska'
            }
          }],
          dueDate: new Date('2024-01-22')
        },
        controller: {
          id: 'ctrl-1',
          name: 'Anna Nowak',
          role: 'Kierownik Jakości',
          avatar: 'https://ui-avatars.com/api/?name=Anna+Nowak'
        },
        history: [],
        photos: []
      },
      {
        id: '5',
        taskId: 'TSK-2024-005',
        controllerId: 'ctrl-2',
        controlNumber: 1,
        status: 'PENDING',
        completionRate: 0,
        qualityScore: 0,
        reportedArea: 0,
        correctedArea: 0,
        reportedLength: 0,
        correctedLength: 0,
        notes: 'Zadanie jeszcze nie rozpoczęte',
        controlDate: new Date('2024-01-16T08:00:00'),
        isActive: true,
        createdAt: new Date('2024-01-16T08:00:00'),
        updatedAt: new Date('2024-01-16T08:00:00'),
        priority: 'LOW',
        task: {
          id: 'TSK-2024-005',
          title: 'Instalacja elektryczna - Apartament 5',
          projectId: 'proj-1',
          project: {
            name: 'Osiedle Słoneczne - Budynek A',
            location: 'Warszawa, Mokotów',
            client: 'Deweloper XYZ'
          },
          assignments: [{
            user: {
              id: 'user-5',
              name: 'Tomasz Nowicki',
              avatar: 'https://ui-avatars.com/api/?name=Tomasz+Nowicki'
            }
          }],
          dueDate: new Date('2024-01-25')
        },
        controller: {
          id: 'ctrl-2',
          name: 'Tomasz Król',
          role: 'Inspektor Jakości',
          avatar: 'https://ui-avatars.com/api/?name=Tomasz+Król'
        },
        history: [],
        photos: []
      }
    ]
  }

  private getMockStats(): QualityControlStats {
    return {
      totalTasks: 5,
      pendingReview: 2,
      approved: 1,
      rejected: 1,
      partiallyApproved: 0,
      inReview: 1,
      averageQualityScore: 87,
      completionRate: 73,
      trends: {
        daily: [
          { date: '2024-01-09', value: 82, label: 'Pon' },
          { date: '2024-01-10', value: 85, label: 'Wt' },
          { date: '2024-01-11', value: 88, label: 'Śr' },
          { date: '2024-01-12', value: 86, label: 'Czw' },
          { date: '2024-01-13', value: 90, label: 'Pt' },
          { date: '2024-01-14', value: 87, label: 'Sob' },
          { date: '2024-01-15', value: 89, label: 'Ndz' }
        ],
        weekly: []
      },
      performanceByProject: [
        {
          projectId: 'proj-1',
          projectName: 'Osiedle Słoneczne',
          tasksCount: 25,
          averageScore: 89,
          completionRate: 78
        },
        {
          projectId: 'proj-2',
          projectName: 'Osiedle Zielone',
          tasksCount: 20,
          averageScore: 84,
          completionRate: 68
        }
      ]
    }
  }
}

export const qualityControlService = new QualityControlService()