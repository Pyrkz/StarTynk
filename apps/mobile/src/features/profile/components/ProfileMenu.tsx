import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components';

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

interface ProfileMenuProps {
  items: MenuItem[];
}

export function ProfileMenu({ items }: ProfileMenuProps) {
  return (
    <View className="mx-4 mt-4 space-y-2">
      {items.map((item, index) => (
        <Pressable key={index} onPress={item.onPress}>
          <Card className="px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color="#737373" 
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-text-primary">
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text className="text-sm text-text-secondary">
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4D4D4" />
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}