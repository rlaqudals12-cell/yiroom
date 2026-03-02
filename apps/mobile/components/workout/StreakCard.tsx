/**
 * 스트릭 카드
 *
 * 운동 연속 기록 상세 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  /** 최근 7일 완료 여부 */
  recentDays?: boolean[];
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function StreakCard({
  currentStreak, longestStreak, weeklyGoal, weeklyCompleted, recentDays = [],
}: StreakCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;

  return (
    <View
      testID="streak-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`연속 ${currentStreak}일, 이번 주 ${weeklyCompleted}/${weeklyGoal}일`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size['2xl'] }}>🔥</Text>
        <View>
          <Text style={{ color: baseColor, fontSize: typography.size['2xl'], fontWeight: '700' }}>
            {currentStreak}일
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>연속 운동</Text>
        </View>
        <View style={styles.longestBadge}>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>최고</Text>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>
            {longestStreak}일
          </Text>
        </View>
      </View>

      {/* 주간 진행 */}
      <View style={[styles.weeklyRow, { marginTop: spacing.sm }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
          이번 주 {weeklyCompleted}/{weeklyGoal}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (weeklyCompleted / weeklyGoal) * 100)}%`, backgroundColor: baseColor, borderRadius: radii.full }]} />
        </View>
      </View>

      {/* 최근 7일 도트 */}
      {recentDays.length > 0 && (
        <View style={[styles.dotsRow, { marginTop: spacing.sm }]}>
          {recentDays.slice(-7).map((done, i) => (
            <View key={i} style={styles.dotItem}>
              <View style={[styles.dot, { backgroundColor: done ? status.success : colors.secondary }]} />
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smx },
  longestBadge: { marginLeft: 'auto', alignItems: 'center' },
  weeklyRow: { gap: 6 },
  progressBar: { height: 6 },
  progressFill: { height: 6 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dotItem: { alignItems: 'center', gap: spacing.xs },
  dot: { width: spacing.smd, height: spacing.smd, borderRadius: 5 },
});
