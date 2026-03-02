/**
 * 스트릭 뱃지
 *
 * 연속 기록 뱃지 (인라인 표시용)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export type StreakLevel = 'sprout' | 'runner' | 'challenger' | 'master' | 'legend';

export interface StreakBadgeProps {
  streak: number;
  compact?: boolean;
}

const STREAK_LEVELS: Array<{ min: number; level: StreakLevel; label: string; emoji: string }> = [
  { min: 100, level: 'legend', label: '레전드', emoji: '👑' },
  { min: 60, level: 'master', label: '마스터', emoji: '⭐' },
  { min: 30, level: 'challenger', label: '챌린저', emoji: '🔥' },
  { min: 7, level: 'runner', label: '러너', emoji: '🏃' },
  { min: 0, level: 'sprout', label: '새싹', emoji: '🌱' },
];

function getStreakLevel(streak: number): (typeof STREAK_LEVELS)[number] {
  return STREAK_LEVELS.find((l) => streak >= l.min) ?? STREAK_LEVELS[STREAK_LEVELS.length - 1];
}

export function StreakBadge({ streak, compact = false }: StreakBadgeProps): React.ReactElement {
  const { colors, module, typography, radii } = useTheme();
  const level = getStreakLevel(streak);

  if (compact) {
    return (
      <View
        testID="streak-badge"
        style={[styles.compact, { backgroundColor: `${module.workout.base}20`, borderRadius: radii.full }]}
        accessibilityLabel={`${streak}일 연속, ${level.label}`}
      >
        <Text style={{ fontSize: typography.size.xs }}>{level.emoji}</Text>
        <Text style={{ color: module.workout.base, fontSize: typography.size.xs, fontWeight: '700' }}>{streak}</Text>
      </View>
    );
  }

  return (
    <View
      testID="streak-badge"
      style={[styles.container, { backgroundColor: `${module.workout.base}15`, borderRadius: radii.lg }]}
      accessibilityLabel={`${streak}일 연속 운동, ${level.label} 레벨`}
    >
      <Text style={{ fontSize: typography.size['2xl'] }}>{level.emoji}</Text>
      <View>
        <Text style={{ color: module.workout.base, fontSize: typography.size.lg, fontWeight: '700' }}>
          {streak}일
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{level.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd, paddingHorizontal: 14, paddingVertical: spacing.smd },
  compact: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 3 },
});
