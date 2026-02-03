/**
 * 피드 라우트 레이아웃
 */

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function FeedLayout() {
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
          title: '피드',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '게시물',
        }}
      />
    </Stack>
  );
}
