/**
 * 스타일 모듈 라우트 레이아웃
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../../lib/theme';

export default function StyleLayout(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen
        name="gallery"
        options={{
          title: '스타일 영감',
        }}
      />
      <Stack.Screen
        name="weather"
        options={{
          title: '날씨 코디',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: '스타일 설정',
        }}
      />
      <Stack.Screen
        name="category/[slug]"
        options={{
          title: '카테고리',
        }}
      />
    </Stack>
  );
}
