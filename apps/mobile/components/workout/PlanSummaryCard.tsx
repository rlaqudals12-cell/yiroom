/**
 * 운동 계획 요약 카드
 *
 * 주간/월간 계획의 전체 요약
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface PlanSummaryCardProps {
  totalExercises: number;
  totalDays: number;
  restDays: number;
  estimatedCalories: number;
  focusAreas: string[];
  difficulty: string;
}

export function PlanSummaryCard({
  totalExercises, totalDays, restDays, estimatedCalories, focusAreas, difficulty,
}: PlanSummaryCardProps): React.ReactElement {
  const { colors, module, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;

  return (
    <View
      testID="plan-summary-card"
      style={[styles.container, { backgroundColor: `${baseColor}10`, borderRadius: radii.lg, padding: spacing.md }]}
      accessibilityLabel={`계획 요약: ${totalExercises}개 운동, ${totalDays}일`}
    >
      <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700', marginBottom: spacing.sm }}>
        계획 요약
      </Text>

      <View style={styles.statsGrid}>
        {[
          { label: '운동 수', value: `${totalExercises}개` },
          { label: '운동일', value: `${totalDays - restDays}일` },
          { label: '휴식일', value: `${restDays}일` },
          { label: '예상 소모', value: `${estimatedCalories}kcal` },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statItem, { backgroundColor: colors.card, borderRadius: radii.md }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{stat.label}</Text>
            <Text style={{ color: baseColor, fontSize: typography.size.base, fontWeight: '700' }}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>난이도</Text>
        <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>{difficulty}</Text>
      </View>

      <View style={[styles.focusRow, { marginTop: spacing.xs }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginRight: spacing.sm }}>집중 부위</Text>
        {focusAreas.slice(0, 3).map((area, i) => (
          <View key={i} style={[styles.focusBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
            <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>{area}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statItem: { width: '47%', alignItems: 'center', padding: spacing.smd },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  focusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
});
