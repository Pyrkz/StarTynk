import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/shared/components';

interface ActivityItem {
  type: 'success' | 'warning' | 'primary';
  title: string;
  description: string;
  time: string;
}

const defaultActivities: ActivityItem[] = [
  {
    type: 'success',
    title: 'Zadanie ukończone',
    description: 'Malowanie ścian - Mieszkanie 10',
    time: '2 godziny temu',
  },
  {
    type: 'warning',
    title: 'Nowe zadanie przypisane',
    description: 'Montaż listew - Mieszkanie 12',
    time: 'Dzisiaj, 14:30',
  },
  {
    type: 'primary',
    title: 'Kontrola jakości zaliczona',
    description: 'Gruntowanie - Mieszkanie 8',
    time: 'Wczoraj, 16:00',
  },
];

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'success':
      return 'bg-success-500';
    case 'warning':
      return 'bg-warning-500';
    case 'primary':
      return 'bg-primary-500';
  }
};

export function RecentActivity() {
  return (
    <View className="px-4 mt-6 mb-6">
      <Text className="text-lg font-semibold text-text-primary mb-3">
        Ostatnia aktywność
      </Text>
      <Card className="p-4 space-y-3">
        {defaultActivities.map((activity, index) => (
          <View key={index} className="flex-row items-start">
            <View className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-1.5 mr-3`} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-primary">
                {activity.title}
              </Text>
              <Text className="text-xs text-text-secondary">
                {activity.description}
              </Text>
              <Text className="text-xs text-text-tertiary mt-1">
                {activity.time}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}