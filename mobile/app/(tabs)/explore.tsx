import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Explore
        </Text>
        <Text className="text-text-secondary text-center">
          This is the explore screen
        </Text>
      </View>
    </SafeAreaView>
  );
}