/**
 * 제품 추천 모듈 레이아웃
 */
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function ProductsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: '600',
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
    </Stack>
  );
}
