import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/shared/components';
import { ProfileStats as ProfileStatsType } from '../types';

interface ProfileStatsProps {
  stats: ProfileStatsType;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <View className="flex-row mx-4 mt-4 space-x-3">
      <Card className="flex-1 p-4 items-center">
        <MaterialCommunityIcons name="calendar-check" size={24} color="#FEAD00" />
        <Text className="text-2xl font-bold text-text-primary mt-2">
          {stats.totalDaysWorked}
        </Text>
        <Text className="text-xs text-text-secondary">Dni pracy</Text>
      </Card>
      <Card className="flex-1 p-4 items-center">
        <MaterialIcons name="task-alt" size={24} color="#22c55e" />
        <Text className="text-2xl font-bold text-text-primary mt-2">
          {stats.totalTasksCompleted}
        </Text>
        <Text className="text-xs text-text-secondary">Zadania</Text>
      </Card>
      {stats.averageRating && (
        <Card className="flex-1 p-4 items-center">
          <MaterialIcons name="star" size={24} color="#f59e0b" />
          <Text className="text-2xl font-bold text-text-primary mt-2">
            {stats.averageRating.toFixed(1)}
          </Text>
          <Text className="text-xs text-text-secondary">Ocena</Text>
        </Card>
      )}
    </View>
  );
}