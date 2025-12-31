/**
 * 운동 모듈 레이아웃
 */
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function WorkoutLayout() {
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
        name="onboarding/index"
        options={{
          title: '운동 시작하기',
        }}
      />
      <Stack.Screen
        name="onboarding/goals"
        options={{
          title: '운동 목표',
        }}
      />
      <Stack.Screen
        name="onboarding/frequency"
        options={{
          title: '운동 빈도',
        }}
      />
      <Stack.Screen
        name="result/index"
        options={{
          title: '운동 타입 결과',
        }}
      />
      <Stack.Screen
        name="session/index"
        options={{
          title: '운동 세션',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
