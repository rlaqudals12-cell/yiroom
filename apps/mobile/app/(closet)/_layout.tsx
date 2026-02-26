/**
 * 옷장 라우트 레이아웃
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function ClosetLayout() {
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
          title: '내 옷장',
        }}
      />
      <Stack.Screen
        name="recommend"
        options={{
          title: '오늘의 코디',
        }}
      />
      <Stack.Screen
        name="outfits"
        options={{
          title: '저장된 코디',
        }}
      />
      <Stack.Screen
        name="outfit-builder"
        options={{
          title: '코디 만들기',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '아이템 상세',
        }}
      />
    </Stack>
  );
}
