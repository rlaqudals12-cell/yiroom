/**
 * HomeHeader — 그라디언트 히어로 배너 + 인사말
 */
import Animated, { FadeIn } from 'react-native-reanimated';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { GradientBackground, GradientText } from '../ui';
import { useTheme, typography, spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

interface HomeHeaderProps {
  userName: string;
  isLoaded: boolean;
}

// 시간대별 인사말
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export function HomeHeader({ userName, isLoaded }: HomeHeaderProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, isDark, brand } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(TIMING.normal)}
      style={[
        {
          marginBottom: spacing.lg,
          borderRadius: radii.xl + 8,
        },
        // 히어로 배너 그림자 (웹 shadow-lg 매칭)
        isDark ? {} : Platform.select({
          ios: { shadowColor: brand.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
          android: { elevation: 4 },
        }) ?? {},
      ]}
      testID="home-header"
    >
      <GradientBackground
        variant="brand"
        style={{
          borderRadius: radii.xl + 8,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
        }}
      >
        <Text style={[styles.greeting, { fontSize: typography.size.sm, color: `${colors.overlayForeground}D9` }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.userName, { fontSize: typography.size['2xl'], color: colors.overlayForeground, letterSpacing: typography.letterSpacing.tighter }]}>
          {isLoaded ? userName : '...'}님
        </Text>
        <GradientText
          variant="extended"
          fontSize={typography.size.xs}
          fontWeight={typography.weight.medium}
          style={styles.slogan}
        >
          온전한 나를 찾는 여정, 이룸
        </GradientText>
      </GradientBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.xs,
  },
  userName: {
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  slogan: {
    marginTop: spacing.xxs,
  },
});
