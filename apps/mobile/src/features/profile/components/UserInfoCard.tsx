import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/shared/components';
import { UserProfile } from '../types';

interface UserInfoCardProps {
  user: UserProfile | null;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'US';

  return (
    <Card className="mx-4 mt-4 p-6">
      <View className="items-center">
        <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-3">
          <Text className="text-2xl font-bold text-primary-600">
            {initials}
          </Text>
        </View>
        <Text className="text-xl font-semibold text-text-primary">
          {user?.name || 'Użytkownik'}
        </Text>
        <Text className="text-sm text-text-secondary mt-1">{user?.email}</Text>
        {user?.phone && (
          <Text className="text-sm text-text-secondary">{user?.phone}</Text>
        )}
        <View className="mt-3 px-3 py-1 bg-primary-100 rounded-full">
          <Text className="text-sm font-medium text-primary-700">
            {user?.role || 'WORKER'}
          </Text>
        </View>
      </View>
    </Card>
  );
}