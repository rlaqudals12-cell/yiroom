/**
 * 리포트 모듈 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme, typography} from '../../lib/theme';

export default function ReportsLayout() {
  const { colors, typography } = useTheme();

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
          title: '나의 리포트',
        }}
      />
      <Stack.Screen
        name="weekly"
        options={{
          title: '주간 리포트',
        }}
      />
      <Stack.Screen
        name="monthly"
        options={{
          title: '월간 리포트',
        }}
      />
      <Stack.Screen
        name="nutrition-history"
        options={{
          title: '영양 이력',
        }}
      />
      <Stack.Screen
        name="weight-goal"
        options={{
          title: '체중 목표',
        }}
      />
      <Stack.Screen
        name="body-progress"
        options={{
          title: '체형 변화 추적',
        }}
      />
    </Stack>
  );
}
