/**
 * 캡슐 에코시스템 라우트 레이아웃
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '../../lib/theme';

export default function CapsuleLayout(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: typography.weight.semibold,
        },
        headerBackTitle: '뒤로',
        animation: 'slide_from_right',
        animationDuration: 280,
        ...(Platform.OS === 'ios' && {
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTransparent: true,
        }),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: '캡슐 대시보드' }}
      />
      <Stack.Screen
        name="daily"
        options={{ title: '오늘의 캡슐' }}
      />
      <Stack.Screen
        name="[domain]"
        options={{ title: '캡슐 상세' }}
      />
      <Stack.Screen
        name="gap"
        options={{ title: '갭 분석' }}
      />
    </Stack>
  );
}
