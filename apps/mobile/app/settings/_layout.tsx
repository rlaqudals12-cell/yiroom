/**
 * 설정 모듈 레이아웃
 */
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function SettingsLayout() {
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
          title: '설정',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: '알림 설정',
        }}
      />
      <Stack.Screen
        name="goals"
        options={{
          title: '목표 설정',
        }}
      />
      <Stack.Screen
        name="widgets"
        options={{
          title: '위젯 설정',
        }}
      />
    </Stack>
  );
}
