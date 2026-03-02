/**
 * 연간 리뷰 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function YearlyReviewLayout() {
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
          title: '연간 리뷰',
        }}
      />
    </Stack>
  );
}
