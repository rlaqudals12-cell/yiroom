/**
 * 영양 모듈 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme, typography} from '../../lib/theme';

export default function NutritionLayout() {
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
        name="scan/index"
        options={{
          title: '바코드 스캔',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search/index"
        options={{
          title: '음식 검색',
        }}
      />
      <Stack.Screen
        name="fasting/index"
        options={{
          title: '단식 트래커',
        }}
      />
      <Stack.Screen
        name="recipe/index"
        options={{
          title: '맞춤 레시피',
        }}
      />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          title: '레시피 상세',
        }}
      />
      <Stack.Screen
        name="history/index"
        options={{
          title: '영양 히스토리',
        }}
      />
    </Stack>
  );
}
