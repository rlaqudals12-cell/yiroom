/**
 * 멘탈 헬스 레이아웃
 */
import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect, Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function MentalHealthLayout() {
  const { colors, typography } = useTheme();

  // ADR-098: 5축 밖의 Mock 웰니스 화면은 Phase 2 복원 전 직접 진입도 차단한다.
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    return <Redirect href="/(tabs)" />;
  }

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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '마음 건강',
        }}
      />
    </Stack>
  );
}
