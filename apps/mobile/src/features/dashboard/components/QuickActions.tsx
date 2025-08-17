import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface QuickAction {
  icon: typeof MaterialIcons | typeof MaterialCommunityIcons | typeof Ionicons;
  iconName: string;
  title: string;
  color: string;
  onPress: () => void;
}

export function QuickActions() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      icon: MaterialCommunityIcons,
      iconName: 'clock-in',
      title: 'Czas pracy',
      color: '#FEAD00',
      onPress: () => router.push('/(tabs)/attendance'),
    },
    {
      icon: MaterialIcons,
      iconName: 'task-alt',
      title: 'Moje zadania',
      color: '#22c55e',
      onPress: () => router.push('/(tabs)/tasks'),
    },
    {
      icon: MaterialIcons,
      iconName: 'report-problem',
      title: 'Zgłoś problem',
      color: '#ef4444',
      onPress: () => {},
    },
    {
      icon: Ionicons,
      iconName: 'stats-chart',
      title: 'Statystyki',
      color: '#3b82f6',
      onPress: () => {},
    },
  ];

  return (
    <View className="px-4 mt-6">
      <Text className="text-lg font-semibold text-text-primary mb-3">
        Szybkie akcje
      </Text>
      <View className="flex-row flex-wrap -mx-1">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <View key={index} className="w-1/2 px-1 mb-2">
              <Pressable
                onPress={action.onPress}
                className="bg-white rounded-lg p-4 items-center active:opacity-80"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  <IconComponent
                    name={action.iconName as any}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text className="text-sm font-medium text-text-primary text-center">
                  {action.title}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}