/**
 * 온보딩 화면 레이아웃
 *
 * V3: 전체 Immersive (headerShown: false) + 슬라이드 전환
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="step1" />
      <Stack.Screen
        name="step2"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="step3"
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
