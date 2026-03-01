/**
 * 운동 기록 카드
 *
 * 과거 운동 세션 기록 표시
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface WorkoutHistoryCardProps {
  id: string;
  date: string;
  workoutName: string;
  duration: number;
  caloriesBurned: number;
  exerciseCount: number;
  intensity: 'low' | 'medium' | 'high';
  onPress?: (id: string) => void;
}

const INTENSITY_CONFIG: Record<string, { label: string; colorKey: 'success' | 'warning' | 'error' }> = {
  low: { label: '저강도', colorKey: 'success' },
  medium: { label: '중강도', colorKey: 'warning' },
  high: { label: '고강도', colorKey: 'error' },
};

export function WorkoutHistoryCard({
  id, date, workoutName, duration, caloriesBurned, exerciseCount, intensity, onPress,
}: WorkoutHistoryCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const intConfig = INTENSITY_CONFIG[intensity];
  const intColor = status[intConfig.colorKey];

  return (
    <Pressable
      testID="workout-history-card"
      onPress={() => onPress?.(id)}
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.md, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${date} ${workoutName}, ${duration}분, ${caloriesBurned}kcal`}
    >
      <View style={styles.header}>
        <View>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>{workoutName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{date}</Text>
        </View>
        <View style={[styles.intBadge, { backgroundColor: `${intColor}20`, borderRadius: radii.full }]}>
          <Text style={{ color: intColor, fontSize: typography.size.xs, fontWeight: '600' }}>{intConfig.label}</Text>
        </View>
      </View>
      <View style={[styles.statsRow, { marginTop: spacing.xs }]}>
        <Text style={{ color: module.workout.base, fontSize: typography.size.xs }}>⏱️ {duration}분</Text>
        <Text style={{ color: module.workout.base, fontSize: typography.size.xs }}>🔥 {caloriesBurned}kcal</Text>
        <Text style={{ color: module.workout.base, fontSize: typography.size.xs }}>💪 {exerciseCount}개</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  intBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  statsRow: { flexDirection: 'row', gap: 12 },
});
