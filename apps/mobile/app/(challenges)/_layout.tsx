/**
 * 챌린지 라우트 레이아웃
 */

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function ChallengesLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        headerStyle: {
          backgroundColor: isDark ? '#0a0a0a' : '#f8f9fc',
        },
        headerTintColor: isDark ? '#fff' : '#111',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '챌린지',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '챌린지 상세',
        }}
      />
    </Stack>
  );
}
