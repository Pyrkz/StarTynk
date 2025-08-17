import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { QuickActions, DashboardStats, RecentActivity } from '../components';

// Mock data for dashboard
const mockDashboard = {
  todayTasks: 3,
  pendingTasks: 5,
  completedThisWeek: 12,
  hoursToday: 6.5,
  currentProject: 'Osiedle Słoneczne',
  notifications: 2,
};

export function DashboardScreen() {
  const { user } = useAuth();
  
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Dzień dobry' : currentHour < 18 ? 'Dzień dobry' : 'Dobry wieczór';

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-border-light">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text-primary">
                {greeting}, {user?.name?.split(' ')[0] || 'Pracowniku'}!
              </Text>
              <Text className="text-sm text-text-secondary mt-1">
                {new Date().toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            {mockDashboard.notifications > 0 && (
              <Pressable className="relative">
                <Ionicons name="notifications-outline" size={24} color="#737373" />
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 rounded-full items-center justify-center">
                  <Text className="text-xs text-white font-medium">
                    {mockDashboard.notifications}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Current Status */}
        <View className="px-4 mt-4">
          <Card className="p-4 bg-primary-50 border border-primary-200">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="office-building" size={20} color="#E69A00" />
              <Text className="text-sm text-primary-700 ml-2">Obecny projekt:</Text>
            </View>
            <Text className="text-lg font-semibold text-primary-900 mt-1">
              {mockDashboard.currentProject}
            </Text>
            <View className="flex-row items-center mt-2">
              <MaterialCommunityIcons name="clock" size={16} color="#E69A00" />
              <Text className="text-sm text-primary-700 ml-1">
                Przepracowano dziś: {mockDashboard.hoursToday}h
              </Text>
            </View>
          </Card>
        </View>

        {/* Dashboard Stats */}
        <DashboardStats stats={mockDashboard} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />
      </ScrollView>
    </SafeAreaView>
  );
}