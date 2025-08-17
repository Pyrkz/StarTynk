import React from 'react';
import { View, Text, Pressable } from 'react-native';

export type FilterType = 'all' | 'active' | 'completed';

interface TaskFiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function TaskFilters({ currentFilter, onFilterChange }: TaskFiltersProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Wszystkie' },
    { key: 'active', label: 'Aktywne' },
    { key: 'completed', label: 'Zakończone' },
  ];

  return (
    <View className="flex-row bg-white px-4 py-3 border-b border-border-light">
      {filters.map((filter, index) => (
        <React.Fragment key={filter.key}>
          <Pressable
            onPress={() => onFilterChange(filter.key)}
            className={`flex-1 py-2 rounded-lg ${
              currentFilter === filter.key ? 'bg-primary-500' : 'bg-neutral-100'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                currentFilter === filter.key ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {filter.label}
            </Text>
          </Pressable>
          {index < filters.length - 1 && <View className="w-2" />}
        </React.Fragment>
      ))}
    </View>
  );
}