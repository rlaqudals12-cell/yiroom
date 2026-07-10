/**
 * AI 트윈(내 AI 아바타) 라우트 레이아웃 (ADR-115)
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function TwinLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen name="index" options={{ title: '내 AI 아바타 만들기' }} />
    </Stack>
  );
}
