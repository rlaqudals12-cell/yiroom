/**
 * WellnessBreakdown — 웰니스 항목별 분석
 *
 * 운동/영양/피부/정신 건강 항목별 점수를 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface WellnessCategory {
  key: string;
  label: string;
  emoji: string;
  score: number;
  maxScore: number;
}

export interface WellnessBreakdownProps {
  categories: WellnessCategory[];
  style?: ViewStyle;
}

export function WellnessBreakdown({
  categories,
  style,
}: WellnessBreakdownProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, score: scoreColors } = useTheme();

  const getBarColor = (percentage: number): string => {
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
      testID="wellness-breakdown"
      accessibilityLabel={`웰니스 상세, ${categories.length}개 항목`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        항목별 분석
      </Text>

      {categories.map((cat) => {
        const percentage = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
        return (
          <View
            key={cat.key}
            style={[styles.categoryRow, { marginBottom: spacing.sm }]}
            accessibilityLabel={`${cat.label} ${cat.score}점`}
          >
            <View style={styles.labelRow}>
              <Text style={{ fontSize: typography.size.sm }}>{cat.emoji}</Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                  marginLeft: spacing.xs,
                  flex: 1,
                }}
              >
                {cat.label}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                  color: getBarColor(percentage),
                }}
              >
                {cat.score}/{cat.maxScore}
              </Text>
            </View>
            <View
              style={[
                styles.barBg,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.full,
                  marginTop: spacing.xxs,
                },
              ]}
            >
              <View
                style={{
                  width: `${percentage}%`,
                  height: 6,
                  backgroundColor: getBarColor(percentage),
                  borderRadius: radii.full,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  categoryRow: {},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    height: 6,
    overflow: 'hidden',
  },
});
