import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { ClockInButton, WeekSummaryCard, RecentDaysList } from '../components';

// Mock data for attendance
const mockAttendance = {
  today: {
    checkIn: '08:15',
    checkOut: null,
    project: 'Osiedle Słoneczne',
    hoursWorked: 0,
  },
  weekSummary: {
    totalHours: 32.5,
    daysWorked: 4,
    overtimeHours: 0,
    regularHours: 32.5,
    weekNumber: 33,
    year: 2024,
  },
  recentDays: [
    { date: '2024-08-16', checkIn: '08:00', checkOut: '16:30', hours: 8.5 },
    { date: '2024-08-15', checkIn: '07:45', checkOut: '16:15', hours: 8.5 },
    { date: '2024-08-14', checkIn: '08:10', checkOut: '16:40', hours: 8.5 },
    { date: '2024-08-13', checkIn: '08:00', checkOut: '15:00', hours: 7.0 },
  ],
};

export function AttendanceScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(!!mockAttendance.today.checkIn && !mockAttendance.today.checkOut);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCheckIn = () => {
    // TODO: Send check-in to API
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    // TODO: Send check-out to API
    setIsCheckedIn(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-4 py-4 border-b border-border-light bg-white">
        <Text className="text-2xl font-semibold text-text-primary">Czas pracy</Text>
        <Text className="text-sm text-text-secondary mt-1">
          {currentTime.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Current Time Display */}
        <Card className="mt-4 p-6 items-center">
          <Text className="text-4xl font-bold text-text-primary">
            {formatTime(currentTime)}
          </Text>
          {isCheckedIn && mockAttendance.today.checkIn && (
            <Text className="text-sm text-text-secondary mt-2">
              Pracujesz od {mockAttendance.today.checkIn}
            </Text>
          )}
        </Card>

        {/* Check In/Out Button */}
        <View className="mt-4">
          <ClockInButton
            isCheckedIn={isCheckedIn}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        </View>

        {/* Current Project */}
        {mockAttendance.today.project && (
          <Card className="mt-4 p-4">
            <View className="flex-row items-center">
              <Ionicons name="location" size={20} color="#FEAD00" />
              <Text className="text-sm text-text-secondary ml-2">Obecny projekt:</Text>
            </View>
            <Text className="text-lg font-medium text-text-primary mt-1">
              {mockAttendance.today.project}
            </Text>
          </Card>
        )}

        {/* Week Summary */}
        <View className="mt-4">
          <WeekSummaryCard summary={mockAttendance.weekSummary} />
        </View>

        {/* Recent Days */}
        <View className="mt-4 mb-6">
          <RecentDaysList days={mockAttendance.recentDays} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}