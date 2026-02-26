
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // Allow headers to be shown
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: Platform.OS === 'ios', // Show header on iOS, hide on Android (uses NativeTabs)
        }}
      />
    </Stack>
  );
}
