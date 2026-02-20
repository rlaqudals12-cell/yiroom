/**
 * 피드 라우트 레이아웃
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function FeedLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
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
