/**
 * 연령 제한 안내 화면
 *
 * 연령 제한 서비스에 대한 안내를 표시한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

export default function AgeRestrictedScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status } = useTheme();

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
        연령 확인이 필요합니다
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
        일부 기능은 만 14세 이상 사용자를 위한 것입니다.{'\n'}
        연령 확인 후 이용하실 수 있습니다.
      </Text>

      <Pressable
        accessibilityLabel="연령 확인하기"
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
          연령 확인하기
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel="뒤로 가기"
        onPress={() => router.back()}
        style={{ padding: spacing.sm }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          뒤로 가기
        </Text>
      </Pressable>
    </View>
  );
}
