/**
 * 챌린지 라우트 레이아웃
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function ChallengesLayout() {
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
