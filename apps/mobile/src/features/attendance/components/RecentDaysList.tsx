import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/shared/components';

interface DayEntry {
  date: string;
  checkIn: string;
  checkOut: string;
  hours: number;
}

interface RecentDaysListProps {
  days: DayEntry[];
}

export function RecentDaysList({ days }: RecentDaysListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View>
      <Text className="text-lg font-semibold text-text-primary mb-3">
        Ostatnie dni
      </Text>
      <View className="space-y-2">
        {days.map((day, index) => (
          <Card key={index} className="p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-medium text-text-primary">
                {formatDate(day.date)}
              </Text>
              <View className="flex-row items-center space-x-3">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="clock-in"
                    size={16}
                    color="#22c55e"
                  />
                  <Text className="text-sm text-text-secondary ml-1">
                    {day.checkIn}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="clock-out"
                    size={16}
                    color="#ef4444"
                  />
                  <Text className="text-sm text-text-secondary ml-1">
                    {day.checkOut}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-primary-600">
                  {day.hours}h
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}