/**
 * 운동 모듈 레이아웃
 */
import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect, Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function WorkoutLayout() {
  const { colors, typography } = useTheme();

  // ADR-098: 라우트 그룹 게이트로 딥링크·푸시·직접 URL 우회를 함께 차단한다.
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
        name="onboarding/index"
        options={{
          title: '운동 시작하기',
        }}
      />
      <Stack.Screen
        name="onboarding/goals"
        options={{
          title: '운동 목표',
        }}
      />
      <Stack.Screen
        name="onboarding/frequency"
        options={{
          title: '운동 빈도',
        }}
      />
      <Stack.Screen
        name="result/index"
        options={{
          title: '운동 타입 결과',
        }}
      />
      <Stack.Screen
        name="session/index"
        options={{
          title: '운동 세션',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="log/index"
        options={{
          title: '운동 기록',
        }}
      />
      <Stack.Screen
        name="history/index"
        options={{
          title: '운동 히스토리',
        }}
      />
      <Stack.Screen
        name="detail/index"
        options={{
          title: '운동 상세',
        }}
      />
      <Stack.Screen
        name="plan/index"
        options={{
          title: '주간 운동 플랜',
        }}
      />
      <Stack.Screen
        name="stretching/index"
        options={{
          title: '스트레칭 가이드',
        }}
      />
      <Stack.Screen
        name="exercise/[id]"
        options={{
          title: '운동 상세',
        }}
      />
    </Stack>
  );
}
