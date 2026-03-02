/**
 * WellnessScoreRing — 대형 웰니스 점수 게이지
 *
 * ScoreGauge를 활용한 대형 원형 점수 표시.
 * 하단에 3가지 영역별 점수를 미니 바로 표시.
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, type AnimatedStyle } from 'react-native-reanimated';

import { ScoreGauge } from '../ui/ScoreGauge';
import { useTheme , spacing } from '../../lib/theme';
import { TIMING, usePulseGlow } from '../../lib/animations';
import type { WellnessBreakdown } from '../../hooks/useWellnessScore';

interface WellnessScoreRingProps {
  score: number;
  breakdown: WellnessBreakdown;
  style?: ViewStyle;
  testID?: string;
}

export function WellnessScoreRing({
  score,
  breakdown,
  style,
  testID,
}: WellnessScoreRingProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, shadows, status } = useTheme();

  // 높은 점수(70+)일 때 은은한 글로우 펄스
  const pulseGlowStyle = usePulseGlow(brand.primary, score >= 70 ? 0.2 : 0);

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`웰니스 점수 ${score}점`}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.lg,
        },
        score >= 70 ? (pulseGlowStyle as AnimatedStyle<ViewStyle>) : undefined,
        style,
      ]}
    >
      {/* 중앙 게이지 */}
      <View style={styles.gaugeRow}>
        <ScoreGauge
          score={score}
          max={100}
          color={brand.primary}
          label="웰니스"
          size={120}
          strokeWidth={10}
          unit="점"
          animated
          delay={300}
          testID={testID ? `${testID}-gauge` : undefined}
        />
      </View>

      {/* 격려 메시지 (점수 0일 때) */}
      {score === 0 && (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          분석을 시작하면 점수가 올라가요
        </Text>
      )}

      {/* 영역별 점수 바 */}
      <View style={[styles.breakdownRow, { marginTop: spacing.md }]}>
        <BreakdownItem
          label="분석"
          value={breakdown.analysis}
          color={status.info}
        />
        <BreakdownItem
          label="운동"
          value={breakdown.workout}
          color={status.success}
        />
        <BreakdownItem
          label="영양"
          value={breakdown.nutrition}
          color={status.warning}
        />
      </View>
    </Animated.View>
  );
}

function BreakdownItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.breakdownItem} accessibilityLabel={`${label} ${value}점`}>
      <View style={styles.breakdownHeader}>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: `${Math.min(value, 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
  },
  gaugeRow: {
    alignItems: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing.smx,
    width: '100%',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
