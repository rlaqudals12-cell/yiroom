/**
 * 연령 제한 안내 화면
 *
 * 연령 제한 서비스에 대한 안내를 표시한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function AgeRestrictedScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      testID="age-restricted-screen"
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>🔒</Text>

      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {t('auth.mobileAgeVerification.restrictedTitle')}
      </Text>

      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: spacing.xl,
        }}
      >
        {t('auth.mobileAgeVerification.restrictedDescription')}
      </Text>

      <Pressable
        accessibilityLabel={t('auth.mobileAgeVerification.verifyButton')}
        onPress={() => router.push('/(auth)/complete-profile')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.full,
          paddingVertical: spacing.smx,
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          {t('auth.mobileAgeVerification.verifyButton')}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel={t('auth.mobileAgeVerification.back')}
        onPress={() => router.back()}
        style={{ padding: spacing.sm }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {t('auth.mobileAgeVerification.back')}
        </Text>
      </Pressable>
    </View>
  );
}
