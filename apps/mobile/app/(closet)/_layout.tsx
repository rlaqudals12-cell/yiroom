/**
 * 옷장 라우트 레이아웃
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function ClosetLayout() {
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
        name="index"
        options={{
          title: '내 옷장',
        }}
      />
      <Stack.Screen
        name="recommend"
        options={{
          title: '오늘의 코디',
        }}
      />
      <Stack.Screen
        name="outfits"
        options={{
          title: '저장된 코디',
        }}
      />
      <Stack.Screen
        name="outfit-builder"
        options={{
          title: '코디 만들기',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '아이템 상세',
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          title: '스타일 갤러리',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: '아이템 편집',
        }}
      />
      <Stack.Screen
        name="outfit/[id]"
        options={{
          title: '코디 상세',
        }}
      />
      <Stack.Screen
        name="outfit/edit/[id]"
        options={{
          title: '코디 편집',
        }}
      />
      <Stack.Screen
        name="weather"
        options={{
          title: '날씨 코디',
        }}
      />
      <Stack.Screen
        name="category/[slug]"
        options={{
          title: '카테고리',
        }}
      />
      <Stack.Screen
        name="style-profile"
        options={{
          title: '스타일 프로필',
        }}
      />
      <Stack.Screen
        name="wardrobe-stats"
        options={{
          title: '옷장 통계',
        }}
      />
      <Stack.Screen
        name="color-analysis"
        options={{
          title: '색상 분석',
        }}
      />
      <Stack.Screen
        name="style"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
