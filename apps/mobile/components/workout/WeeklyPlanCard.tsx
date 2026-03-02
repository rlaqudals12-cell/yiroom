/**
 * 주간 운동 계획 카드
 *
 * 7일 운동 계획 요약
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export interface DayPlan {
  day: string;
  isRestDay: boolean;
  exerciseCount: number;
  focusArea?: string;
  totalMinutes?: number;
}

export interface WeeklyPlanCardProps {
  weekLabel: string;
  days: DayPlan[];
  completedDays?: number;
  onDayPress?: (day: string) => void;
}

export function WeeklyPlanCard({
  weekLabel, days, completedDays = 0, onDayPress,
}: WeeklyPlanCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;

  return (
    <View
      testID="weekly-plan-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`${weekLabel} 운동 계획, ${completedDays}일 완료`}
    >
      <View style={styles.header}>
        <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700' }}>
          {weekLabel}
        </Text>
        <Text style={{ color: baseColor, fontSize: typography.size.sm, fontWeight: '600' }}>
          {completedDays}/{days.length}일
        </Text>
      </View>

      <View style={[styles.daysRow, { marginTop: spacing.sm }]}>
        {days.map((day) => (
          <Pressable
            key={day.day}
            onPress={() => onDayPress?.(day.day)}
            style={[
              styles.dayItem,
              {
                backgroundColor: day.isRestDay ? colors.secondary : `${baseColor}15`,
                borderRadius: radii.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${day.day}, ${day.isRestDay ? '휴식일' : `${day.exerciseCount}개 운동`}`}
          >
            <Text style={{ color: day.isRestDay ? colors.mutedForeground : baseColor, fontSize: typography.size.xs, fontWeight: '700' }}>
              {day.day}
            </Text>
            {day.isRestDay ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>휴식</Text>
            ) : (
              <>
                <Text style={{ color: baseColor, fontSize: typography.size.sm, fontWeight: '700' }}>
                  {day.exerciseCount}
                </Text>
                {day.focusArea && (
                  <Text style={{ color: colors.mutedForeground, fontSize: 10 }} numberOfLines={1}>
                    {day.focusArea}
                  </Text>
                )}
              </>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.xxs },
});
