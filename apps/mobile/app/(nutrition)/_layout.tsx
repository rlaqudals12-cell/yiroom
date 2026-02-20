/**
 * 영양 모듈 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function NutritionLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: '뒤로',
      }}
    >
      <Stack.Screen
        name="dashboard/index"
        options={{
          title: '영양 관리',
        }}
      />
      <Stack.Screen
        name="record/index"
        options={{
          title: '식사 기록',
        }}
      />
      <Stack.Screen
        name="water/index"
        options={{
          title: '물 섭취',
        }}
      />
      <Stack.Screen
        name="camera/index"
        options={{
          title: '식사 기록',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search/index"
        options={{
          title: '음식 검색',
        }}
      />
    </Stack>
  );
}
