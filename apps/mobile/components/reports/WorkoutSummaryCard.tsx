/**
 * WorkoutSummaryCard — 운동 요약 카드
 *
 * 주간/월간 운동 요약 통계를 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface WorkoutSummaryCardProps {
  totalSessions: number;
  totalMinutes: number;
  totalCalories: number;
  period: string;
  style?: ViewStyle;
}

export function WorkoutSummaryCard({
  totalSessions,
  totalMinutes,
  totalCalories,
  period,
  style,
}: WorkoutSummaryCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module } = useTheme();

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
      testID="workout-summary-card"
      accessibilityLabel={`${period} 운동 요약`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>💪</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
          }}
        >
          운동 요약
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginLeft: spacing.xs,
          }}
        >
          {period}
        </Text>
      </View>

      <View style={[styles.statsRow, { marginTop: spacing.md, gap: spacing.md }]}>
        <View style={styles.statItem}>
          <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: module.workout.base }}>
            {totalSessions}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
            운동 횟수
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: module.workout.base }}>
            {totalMinutes}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
            총 시간(분)
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: module.workout.base }}>
            {totalCalories}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
            소모 칼로리
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
});
