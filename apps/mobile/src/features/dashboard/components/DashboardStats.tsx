import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/shared/components';

interface DashboardStats {
  todayTasks: number;
  pendingTasks: number;
  completedThisWeek: number;
}

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <View className="px-4 mt-4">
      <Text className="text-lg font-semibold text-text-primary mb-3">
        Dzisiejsze podsumowanie
      </Text>
      <View className="flex-row space-x-3">
        <Card className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-text-primary">
                {stats.todayTasks}
              </Text>
              <Text className="text-xs text-text-secondary">Do zrobienia</Text>
            </View>
            <MaterialIcons name="today" size={24} color="#FEAD00" />
          </View>
        </Card>
        <Card className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-text-primary">
                {stats.pendingTasks}
              </Text>
              <Text className="text-xs text-text-secondary">W trakcie</Text>
            </View>
            <MaterialCommunityIcons name="progress-clock" size={24} color="#f59e0b" />
          </View>
        </Card>
        <Card className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-text-primary">
                {stats.completedThisWeek}
              </Text>
              <Text className="text-xs text-text-secondary">Ten tydzień</Text>
            </View>
            <MaterialIcons name="check-circle" size={24} color="#22c55e" />
          </View>
        </Card>
      </View>
    </View>
  );
}