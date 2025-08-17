import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { TaskFilters, TaskList, FilterType } from '../components';
import { Task } from '../types';

// Temporary mock data - will be replaced with API calls
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Malowanie ścian - Mieszkanie 12',
    project: 'Osiedle Słoneczne',
    projectId: 'proj-1',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2024-08-18',
    area: 45.5,
    completionRate: 75,
    assigneeId: 'user-1',
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-15T14:30:00Z',
  },
  {
    id: '2',
    title: 'Montaż listew przypodłogowych',
    project: 'Osiedle Słoneczne',
    projectId: 'proj-1',
    status: 'NEW',
    priority: 'MEDIUM',
    dueDate: '2024-08-20',
    area: 25.0,
    completionRate: 0,
    assigneeId: 'user-1',
    createdAt: '2024-08-10T09:00:00Z',
    updatedAt: '2024-08-10T09:00:00Z',
  },
  {
    id: '3',
    title: 'Gruntowanie ścian - Mieszkanie 15',
    project: 'Osiedle Zielone',
    projectId: 'proj-2',
    status: 'READY_FOR_PICKUP',
    priority: 'LOW',
    dueDate: '2024-08-19',
    area: 60.0,
    completionRate: 100,
    assigneeId: 'user-1',
    createdAt: '2024-08-05T11:00:00Z',
    updatedAt: '2024-08-16T16:00:00Z',
  },
];

export function TasksScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('active');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch tasks from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredTasks = mockTasks.filter(task => {
    if (filter === 'active') {
      return ['NEW', 'IN_PROGRESS'].includes(task.status);
    } else if (filter === 'completed') {
      return ['READY_FOR_PICKUP', 'APPROVED', 'PAID'].includes(task.status);
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-4 py-4 border-b border-border-light bg-white">
        <Text className="text-2xl font-semibold text-text-primary">Moje zadania</Text>
        <Text className="text-sm text-text-secondary mt-1">
          Witaj, {user?.name?.split(' ')[0] || 'Pracowniku'}
        </Text>
      </View>

      <TaskFilters currentFilter={filter} onFilterChange={setFilter} />
      
      <TaskList 
        tasks={filteredTasks} 
        refreshing={refreshing} 
        onRefresh={onRefresh} 
      />
    </SafeAreaView>
  );
}