
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for all screens in this stack
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard'
        }}
      />
    </Stack>
  );
}
