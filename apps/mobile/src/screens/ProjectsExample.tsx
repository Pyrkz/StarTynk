import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useProjects } from '../hooks/useProjects';
import { Project, ProjectStatus } from '@repo/shared/types';

export default function ProjectsExample() {
  const { projects, loading, error, refetch } = useProjects();

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'bg-success-500';
      case ProjectStatus.COMPLETED:
        return 'bg-neutral-500';
      case ProjectStatus.PAUSED:
        return 'bg-warning-500';
      case ProjectStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-primary-500';
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      className="bg-white p-4 mx-4 mb-3 rounded-lg shadow-sm"
      onPress={() => {
        // Navigate to project detail
        console.log('Navigate to project:', item.id);
      }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-neutral-900 flex-1">
          {item.name}
        </Text>
        <View className={`px-2 py-1 rounded ${getStatusColor(item.status)}`}>
          <Text className="text-xs text-white font-medium">
            {item.status}
          </Text>
        </View>
      </View>
      
      <Text className="text-neutral-600 text-sm mb-1">{item.address}</Text>
      
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-sm text-neutral-500">
          Rate: ${item.baseRate}/m²
        </Text>
        <Text className="text-sm text-neutral-500">
          {new Date(item.startDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !projects.length) {
    return (
      <View className="flex-1 justify-center items-center bg-app-background">
        <ActivityIndicator size="large" color="#FEAD00" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-app-background px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-primary-500 px-6 py-3 rounded-lg"
          onPress={refetch}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-background">
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={['#FEAD00']}
            tintColor="#FEAD00"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-neutral-500 text-center">
              No projects found
            </Text>
          </View>
        }
      />
    </View>
  );
}