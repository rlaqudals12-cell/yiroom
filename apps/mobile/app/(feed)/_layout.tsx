/**
 * 피드 라우트 레이아웃
 */

import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect, Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function FeedLayout() {
  const { colors } = useTheme();

  // ADR-098 §2.4.2 기능 과잉 정리: 소셜 피드 숨김 (코드 유지, SOCIAL_FEED=true 시 복원)
  if (!FEATURE_FLAGS.SOCIAL_FEED) {
    return <Redirect href="/(tabs)" />;
  }

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
          title: '피드',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '게시물',
        }}
      />
    </Stack>
  );
}
