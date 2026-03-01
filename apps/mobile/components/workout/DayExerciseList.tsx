/**
 * 일일 운동 리스트
 *
 * 특정 요일의 운동 목록 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface DayExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds?: number;
  isCompleted?: boolean;
}

export interface DayExerciseListProps {
  dayLabel: string;
  exercises: DayExercise[];
  totalMinutes?: number;
}

export function DayExerciseList({
  dayLabel, exercises, totalMinutes,
}: DayExerciseListProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const completedCount = exercises.filter((e) => e.isCompleted).length;

  return (
    <View
      testID="day-exercise-list"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`${dayLabel} 운동 ${exercises.length}개, ${completedCount}개 완료`}
    >
      <View style={styles.header}>
        <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700' }}>
          {dayLabel}
        </Text>
        <View style={styles.headerMeta}>
          <Text style={{ color: module.workout.base, fontSize: typography.size.xs, fontWeight: '600' }}>
            {completedCount}/{exercises.length}
          </Text>
          {totalMinutes !== undefined && (
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
              {totalMinutes}분
            </Text>
          )}
        </View>
      </View>

      {exercises.map((exercise) => (
        <View key={exercise.id} style={[styles.exerciseRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.statusDot, { backgroundColor: exercise.isCompleted ? status.success : colors.secondary }]} />
          <View style={{ flex: 1 }}>
            <Text style={{
              color: exercise.isCompleted ? colors.mutedForeground : colors.foreground,
              fontSize: typography.size.sm,
              fontWeight: '500',
              textDecorationLine: exercise.isCompleted ? 'line-through' : 'none',
            }}>
              {exercise.name}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
              {exercise.sets}세트 × {exercise.reps}회
              {exercise.weight ? ` · ${exercise.weight}kg` : ''}
            </Text>
          </View>
          {exercise.restSeconds && (
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
              휴식 {exercise.restSeconds}초
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
