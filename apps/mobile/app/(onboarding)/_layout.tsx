/**
 * 온보딩 화면 레이아웃
 */

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function OnboardingLayout() {
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
        // 뒤로가기 버튼 숨김 (온보딩 중에는)
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="step1"
        options={{
          title: '시작하기',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="step2"
        options={{
          title: '기본 정보',
          headerBackVisible: true,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="step3"
        options={{
          title: '선호도 설정',
          headerBackVisible: true,
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
