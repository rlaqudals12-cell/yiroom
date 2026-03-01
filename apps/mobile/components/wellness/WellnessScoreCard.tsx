/**
 * WellnessScoreCard — 웰니스 종합 점수 카드
 *
 * 운동+영양+피부+정신건강 종합 웰니스 점수를 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface WellnessScoreCardProps {
  score: number;
  maxScore?: number;
  change?: number;
  style?: ViewStyle;
}

export function WellnessScoreCard({
  score,
  maxScore = 100,
  change,
  style,
}: WellnessScoreCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand, status, score: scoreColors } = useTheme();

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const getScoreColor = (): string => {
    if (percentage >= 80) return scoreColors.excellent;
    if (percentage >= 60) return scoreColors.good;
    if (percentage >= 40) return scoreColors.caution;
    return scoreColors.poor;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="wellness-score-card"
      accessibilityLabel={`웰니스 점수 ${score}점`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
        }}
      >
        종합 웰니스 점수
      </Text>

      <View style={[styles.scoreRow, { marginTop: spacing.md }]}>
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: getScoreColor(),
          }}
        >
          {score}
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, marginLeft: spacing.xxs }}>
          / {maxScore}
        </Text>
      </View>

      {change !== undefined && (
        <View style={[styles.changeRow, { marginTop: spacing.xs }]}>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: change >= 0 ? status.success : status.error,
              fontWeight: typography.weight.medium,
            }}
          >
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}점
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginLeft: spacing.xxs }}>
            지난주 대비
          </Text>
        </View>
      )}

      {/* 프로그레스 바 */}
      <View
        style={[
          styles.barBg,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: 8,
            backgroundColor: getScoreColor(),
            borderRadius: radii.full,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    height: 8,
    overflow: 'hidden',
  },
});
