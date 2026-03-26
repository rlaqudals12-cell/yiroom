/**
 * OnboardingHero — 온보딩 히어로 헤더 공통 컴포넌트
 *
 * GlassCard + GradientText 패턴으로 통일.
 * 모든 온보딩 화면에서 동일한 시각 언어 사용.
 */
import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, GradientText } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing } from '@/lib/theme';

interface OnboardingHeroProps {
  /** Lucide 아이콘 컴포넌트 (권장) */
  icon?: LucideIcon;
  /** 아이콘 색상 (기본: brand.primary) */
  iconColor?: string;
  title: string;
  subtitle: string;
  glowColor?: string;
  testID?: string;
  style?: ViewStyle;
}

export function OnboardingHero({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  glowColor,
  testID = 'onboarding-hero',
  style,
}: OnboardingHeroProps): React.JSX.Element {
  const { colors, brand } = useTheme();

  return (
    <Animated.View entering={FadeInUp.duration(TIMING.normal)} style={style}>
      <GlassCard shadowSize="lg" glowColor={glowColor} testID={testID}>
        <View style={styles.content}>
          {Icon && (
            <View style={styles.iconWrap}>
              <Icon size={36} color={iconColor ?? brand.primary} />
            </View>
          )}
          <GradientText variant="extended" fontSize={28} fontWeight="700" style={styles.title}>
            {title}
          </GradientText>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
