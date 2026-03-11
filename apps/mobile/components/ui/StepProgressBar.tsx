/**
 * 온보딩 스텝 프로그레스 바
 * step1/3, step2/3, step3/3 형태로 현재 진행 상황 표시
 */
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

interface StepProgressBarProps {
  current: number;
  total: number;
  accentColor: string;
  testID?: string;
}

export function StepProgressBar({
  current,
  total,
  accentColor,
  testID,
}: StepProgressBarProps): React.JSX.Element {
  const { colors } = useTheme();
  const progress = (current / total) * 100;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.container}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
      accessibilityLabel={`${total}단계 중 ${current}단계`}
    >
      <View style={styles.header}>
        <Text style={[styles.stepText, { color: accentColor }]}>
          {current}/{total}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>단계</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <LinearGradient
          colors={[accentColor, `${accentColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${progress}%` }]}
        />
        {/* 스텝 도트 표시 */}
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: `${((i + 1) / total) * 100}%`,
                backgroundColor: i < current ? accentColor : colors.muted,
                borderColor: i < current ? accentColor : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  stepText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  label: {
    fontSize: typography.size.xs,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  dot: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginLeft: -6,
  },
});
