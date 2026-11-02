import { Stack } from 'expo-router';

export default function ExamplesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'black' },
        headerTintColor: '#FFD60A',
        headerTitleStyle: { color: 'white' },
        contentStyle: { backgroundColor: 'black' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerBackTitle: 'Examples' }} />
    </Stack>
  );
}
