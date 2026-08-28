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
        redirect
        options={{
          title: '스타일 갤러리',
        }}
      />
      {/* 실제 편집 경로는 [id]/edit — 중복 목업이던 edit/[id]는 폐기(2026-08) */}
      <Stack.Screen
        name="[id]/edit"
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
        redirect
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
        redirect
        options={{
          title: '스타일 프로필',
        }}
      />
      <Stack.Screen
        name="wardrobe-stats"
        redirect
        options={{
          title: '옷장 통계',
        }}
      />
      <Stack.Screen
        name="color-analysis"
        redirect
        options={{
          title: '색상 분석',
        }}
      />
      {/* 하위 5개 화면은 현재 제품 동선과 연결되지 않은 보류 표면이라 등록에서 제외한다. */}
      <Stack.Screen
        name="style"
        redirect
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
