import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Badge } from '@/shared/components';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskCardProps {
  task: Task;
}

const statusLabels: Record<TaskStatus, string> = {
  NEW: 'Nowe',
  IN_PROGRESS: 'W trakcie',
  READY_FOR_PICKUP: 'Do odbioru',
  APPROVED: 'Zatwierdzone',
  PAID: 'Zapłacone',
};

const statusColors: Record<TaskStatus, 'primary' | 'warning' | 'success' | 'neutral'> = {
  NEW: 'primary',
  IN_PROGRESS: 'warning',
  READY_FOR_PICKUP: 'success',
  APPROVED: 'success',
  PAID: 'neutral',
};

const priorityColors: Record<TaskPriority, 'neutral' | 'warning' | 'error'> = {
  LOW: 'neutral',
  MEDIUM: 'warning',
  HIGH: 'error',
  URGENT: 'error',
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-semibold text-text-primary">
            {task.title}
          </Text>
          <Text className="text-sm text-text-secondary mt-1">
            {task.project}
          </Text>
        </View>
        <Badge variant={priorityColors[task.priority]} size="small">
          {task.priority}
        </Badge>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <MaterialIcons name="square-foot" size={16} color="#737373" />
          <Text className="text-sm text-text-secondary ml-1">
            {task.area} m²
          </Text>
        </View>
        <View className="flex-row items-center">
          <MaterialIcons name="calendar-today" size={16} color="#737373" />
          <Text className="text-sm text-text-secondary ml-1">
            {new Date(task.dueDate).toLocaleDateString('pl-PL')}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-border-light">
        <View className="flex-row justify-between items-center">
          <Badge variant={statusColors[task.status]} size="medium">
            {statusLabels[task.status]}
          </Badge>
          {task.completionRate > 0 && (
            <Text className="text-sm text-text-secondary">
              Ukończono: {task.completionRate}%
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {task.completionRate > 0 && (
        <View className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary-500"
            style={{ width: `${task.completionRate}%` }}
          />
        </View>
      )}
    </Card>
  );
}