/**
 * 인증 화면 레이아웃
 */
import { Stack } from 'expo-router';

import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

export default function AuthLayout() {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

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
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: t('auth.signIn'),
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: t('auth.signUp'),
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: t('auth.mobileForgotPassword.title'),
        }}
      />
      <Stack.Screen
        name="complete-profile"
        options={{
          title: t('auth.mobileAgeVerification.eyebrow'),
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="age-restricted"
        options={{
          title: t('auth.mobileAgeVerification.restrictedEyebrow'),
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
