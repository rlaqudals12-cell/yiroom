/**
 * 운동 메트릭 대시보드
 *
 * 주간/월간 운동 통계 요약
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface WorkoutMetrics {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  avgIntensity: number;
  streak: number;
  personalBests?: Array<{ exercise: string; record: string }>;
}

export interface WorkoutMetricsDashboardProps {
  metrics: WorkoutMetrics;
  period: 'weekly' | 'monthly';
}

export function WorkoutMetricsDashboard({
  metrics, period,
}: WorkoutMetricsDashboardProps): React.ReactElement {
  const { colors, module, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;
  const periodLabel = period === 'weekly' ? '이번 주' : '이번 달';

  return (
    <View
      testID="workout-metrics-dashboard"
      accessibilityLabel={`${periodLabel} 운동 통계`}
    >
      <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700', marginBottom: spacing.sm }}>
        {periodLabel} 운동 통계
      </Text>

      <View style={styles.metricsGrid}>
        {[
          { label: '운동 횟수', value: `${metrics.totalWorkouts}회`, emoji: '🏋️' },
          { label: '총 시간', value: `${metrics.totalMinutes}분`, emoji: '⏱️' },
          { label: '소모 칼로리', value: `${metrics.totalCalories}kcal`, emoji: '🔥' },
          { label: '연속 기록', value: `${metrics.streak}일`, emoji: '🔥' },
        ].map((item) => (
          <View key={item.label} style={[styles.metricCard, { backgroundColor: colors.card, borderRadius: radii.md, borderColor: colors.border }]}>
            <Text style={{ fontSize: typography.size.lg }}>{item.emoji}</Text>
            <Text style={{ color: baseColor, fontSize: typography.size.lg, fontWeight: '700' }}>{item.value}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* 평균 강도 */}
      <View style={[styles.intensityRow, { marginTop: spacing.sm }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>평균 강도</Text>
        <View style={[styles.intensityBar, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
          <View style={[styles.intensityFill, { width: `${metrics.avgIntensity}%`, backgroundColor: baseColor, borderRadius: radii.full }]} />
        </View>
        <Text style={{ color: baseColor, fontSize: typography.size.sm, fontWeight: '600' }}>{metrics.avgIntensity}%</Text>
      </View>

      {/* 개인 최고 기록 */}
      {metrics.personalBests && metrics.personalBests.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: spacing.xs }}>
            🏆 개인 최고 기록
          </Text>
          {metrics.personalBests.slice(0, 3).map((pb, i) => (
            <View key={i} style={styles.pbRow}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{pb.exercise}</Text>
              <Text style={{ color: baseColor, fontSize: typography.size.xs, fontWeight: '600' }}>{pb.record}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '47%', alignItems: 'center', padding: spacing.smx, borderWidth: 1, gap: spacing.xxs },
  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intensityBar: { flex: 1, height: 6 },
  intensityFill: { height: 6 },
  pbRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
});
