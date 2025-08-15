import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Welcome to StarTynk
        </Text>
        <Text className="text-text-secondary text-center">
          You are now logged in to the app
        </Text>
      </View>
    </SafeAreaView>
  );
}