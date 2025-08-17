import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { useRouter } from 'expo-router';
import { UserInfoCard, ProfileStats, ProfileMenu } from '../components';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Dane osobowe',
      subtitle: 'Edytuj swoje dane',
      onPress: () => Alert.alert('Info', 'Funkcja w przygotowaniu'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Zmień hasło',
      subtitle: 'Zabezpiecz swoje konto',
      onPress: () => Alert.alert('Info', 'Funkcja w przygotowaniu'),
    },
    {
      icon: 'notifications-outline',
      title: 'Powiadomienia',
      subtitle: 'Zarządzaj powiadomieniami',
      onPress: () => Alert.alert('Info', 'Funkcja w przygotowaniu'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Pomoc',
      subtitle: 'FAQ i wsparcie',
      onPress: () => Alert.alert('Info', 'Funkcja w przygotowaniu'),
    },
    {
      icon: 'information-circle-outline',
      title: 'O aplikacji',
      subtitle: 'Wersja 1.0.0',
      onPress: () => Alert.alert('StarTynk Mobile', 'Wersja 1.0.0\n\n© 2024 StarTynk'),
    },
  ];

  const stats = {
    totalDaysWorked: 23,
    totalTasksCompleted: 156,
    averageRating: 4.8,
  };

  const userProfile = user ? {
    id: user.id,
    name: user.name || 'Użytkownik',
    email: user.email,
    phone: user.phone,
    role: user.role || 'WORKER',
  } : null;

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-4 py-4 border-b border-border-light bg-white">
        <Text className="text-2xl font-semibold text-text-primary">Profil</Text>
      </View>

      <ScrollView className="flex-1">
        {/* User Info Card */}
        <UserInfoCard user={userProfile} />

        {/* Quick Stats */}
        <ProfileStats stats={stats} />

        {/* Menu Items */}
        <ProfileMenu items={menuItems} />

        {/* Logout Button */}
        <View className="mx-4 mt-6 mb-6">
          <Button
            title="Wyloguj się"
            onPress={handleLogout}
            variant="secondary"
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}