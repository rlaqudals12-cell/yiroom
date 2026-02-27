/**
 * 제품 추천 모듈 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme, typography} from '../../lib/theme';

export default function ProductsLayout() {
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
          title: '제품 추천',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '제품 상세',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: '제품 검색',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{ title: '위시리스트' }}
      />
      <Stack.Screen
        name="recommendations"
        options={{ title: 'AI 맞춤 추천' }}
      />
    </Stack>
  );
}
