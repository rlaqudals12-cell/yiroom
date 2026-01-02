/**
 * 소셜 기능 레이아웃
 */

import { Stack } from 'expo-router';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
      }}
    >
      <Stack.Screen
        name="friends/index"
        options={{
          title: '친구',
        }}
      />
      <Stack.Screen
        name="friends/search"
        options={{
          title: '친구 찾기',
        }}
      />
      <Stack.Screen
        name="friends/requests"
        options={{
          title: '친구 요청',
        }}
      />
      <Stack.Screen
        name="leaderboard/index"
        options={{
          title: '리더보드',
        }}
      />
    </Stack>
  );
}
