import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth';

export default function TabLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('🔷 TabLayout - Auth state:', { isAuthenticated, isLoading, hasUser: !!user });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#FEAD00" />
      </View>
    );
  }

  // Protect tabs - redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🔷 TabLayout - User not authenticated, redirecting to login');
    return <Redirect href="/login" />;
  }

  console.log('🔷 TabLayout - User authenticated, showing tabs');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FEAD00',
        tabBarInactiveTintColor: '#737373',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E5E5E5',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter_500Medium',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Zadania',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="task-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Czas pracy',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-time-four" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide explore tab for workers
        }}
      />
    </Tabs>
  );
}