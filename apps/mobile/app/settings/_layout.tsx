/**
 * 설정 모듈 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme, typography} from '../../lib/theme';

export default function SettingsLayout() {
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
      <Stack.Screen
        name="privacy"
        options={{
          title: '개인정보 설정',
        }}
      />
      <Stack.Screen
        name="my-info"
        options={{
          title: '내 정보 수정',
        }}
      />
    </Stack>
  );
}
