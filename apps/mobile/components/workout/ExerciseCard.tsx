/**
 * 운동 카드
 *
 * 개별 운동 정보 (난이도, 부위, 칼로리, MET)
 */

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'cardio';

export interface ExerciseCardProps {
  id: string;
  name: string;
  nameEn?: string;
  difficulty: DifficultyLevel;
  muscleGroups: MuscleGroup[];
  met: number;
  caloriesPerMinute?: number;
  durationMinutes?: number;
  /** compact 모드 (리스트 행) */
  compact?: boolean;
  onPress?: (id: string) => void;
}

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; colorKey: 'success' | 'warning' | 'error' }> = {
  beginner: { label: '초급', colorKey: 'success' },
  intermediate: { label: '중급', colorKey: 'warning' },
  advanced: { label: '고급', colorKey: 'error' },
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: '가슴', back: '등', legs: '하체', shoulders: '어깨',
  arms: '팔', core: '코어', full_body: '전신', cardio: '유산소',
};

export const ExerciseCard = memo(function ExerciseCard({
  id, name, nameEn, difficulty, muscleGroups, met,
  caloriesPerMinute, durationMinutes, compact = false, onPress,
}: ExerciseCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const diffColor = status[diffConfig.colorKey];

  if (compact) {
    return (
      <Pressable
        testID="exercise-card"
        onPress={() => onPress?.(id)}
        style={[styles.compactContainer, { borderBottomColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${diffConfig.label}`}
      >
        <View style={styles.compactLeft}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>{name}</Text>
          <View style={styles.compactMeta}>
            {muscleGroups.slice(0, 2).map((mg) => (
              <Text key={mg} style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{MUSCLE_LABELS[mg]}</Text>
            ))}
          </View>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20`, borderRadius: radii.full }]}>
          <Text style={{ color: diffColor, fontSize: typography.size.xs, fontWeight: '600' }}>{diffConfig.label}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="exercise-card"
      onPress={() => onPress?.(id)}
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${diffConfig.label}, MET ${met}`}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700' }}>{name}</Text>
          {nameEn && (
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{nameEn}</Text>
          )}
        </View>
        <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20`, borderRadius: radii.full }]}>
          <Text style={{ color: diffColor, fontSize: typography.size.xs, fontWeight: '600' }}>{diffConfig.label}</Text>
        </View>
      </View>

      <View style={[styles.muscleRow, { marginTop: spacing.sm }]}>
        {muscleGroups.map((mg) => (
          <View key={mg} style={[styles.muscleBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
            <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>{MUSCLE_LABELS[mg]}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
        <Text style={{ color: module.workout.base, fontSize: typography.size.xs, fontWeight: '600' }}>
          MET {met}
        </Text>
        {caloriesPerMinute !== undefined && (
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            {caloriesPerMinute} kcal/분
          </Text>
        )}
        {durationMinutes !== undefined && (
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            {durationMinutes}분
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14 },
  compactContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  compactLeft: { flex: 1 },
  compactMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', gap: 12 },
});
