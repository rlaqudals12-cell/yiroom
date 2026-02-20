/**
 * 인증 화면 레이아웃
 */
import { Stack } from 'expo-router';

import { useTheme } from '../../lib/theme';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: '로그인',
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: '회원가입',
        }}
      />
    </Stack>
  );
}
