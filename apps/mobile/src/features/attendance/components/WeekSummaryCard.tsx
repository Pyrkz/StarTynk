import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/shared/components';
import { WeekSummary } from '../types';

interface WeekSummaryCardProps {
  summary: WeekSummary;
}

export function WeekSummaryCard({ summary }: WeekSummaryCardProps) {
  return (
    <Card className="p-4">
      <Text className="text-lg font-semibold text-text-primary mb-3">
        Podsumowanie tygodnia
      </Text>
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-sm text-text-secondary">Przepracowane godziny:</Text>
          <Text className="text-sm font-medium text-text-primary">
            {summary.totalHours} h
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-text-secondary">Dni pracy:</Text>
          <Text className="text-sm font-medium text-text-primary">
            {summary.daysWorked}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-text-secondary">Nadgodziny:</Text>
          <Text className="text-sm font-medium text-warning-600">
            {summary.overtimeHours} h
          </Text>
        </View>
      </View>
    </Card>
  );
}