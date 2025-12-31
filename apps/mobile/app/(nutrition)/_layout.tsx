/**
 * 영양 모듈 레이아웃
 */
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function NutritionLayout() {
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
    </Stack>
  );
}
