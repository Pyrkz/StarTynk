import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirect to home tab
  return <Redirect href="/(tabs)/home" />;
}