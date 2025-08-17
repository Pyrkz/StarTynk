import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { TaskCard } from './TaskCard';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function TaskList({ tasks, refreshing, onRefresh }: TaskListProps) {
  return (
    <ScrollView
      className="flex-1 px-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="py-4 space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </View>
    </ScrollView>
  );
}