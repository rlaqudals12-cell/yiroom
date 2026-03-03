/**
 * 운동 세션 카드
 *
 * 현재 진행 중인 운동 세션의 개별 운동 표시
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export type ExerciseStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface ExerciseSessionCardProps {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  currentSet?: number;
  status: ExerciseStatus;
  onStart?: () => void;
  onSkip?: () => void;
}

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; emoji: string }> = {
  pending: { label: '대기', emoji: '⏳' },
  in_progress: { label: '진행 중', emoji: '🏋️' },
  completed: { label: '완료', emoji: '✅' },
  skipped: { label: '건너뜀', emoji: '⏭️' },
};

export function ExerciseSessionCard({
  name, sets, reps, weight, currentSet, status: exerciseStatus, onStart, onSkip,
}: ExerciseSessionCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;
  const config = STATUS_CONFIG[exerciseStatus];
  const isActive = exerciseStatus === 'in_progress';

  return (
    <View
      testID="exercise-session-card"
      style={[
        styles.container,
        {
          backgroundColor: isActive ? `${baseColor}10` : colors.card,
          borderRadius: radii.xl,
          borderColor: isActive ? baseColor : colors.border,
        },
      ]}
      accessibilityLabel={`${name}, ${config.label}, ${sets}세트 ${reps}회`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>{config.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: exerciseStatus === 'skipped' ? colors.mutedForeground : colors.foreground,
            fontSize: typography.size.sm,
            fontWeight: '600',
            textDecorationLine: exerciseStatus === 'skipped' ? 'line-through' : 'none',
          }}>
            {name}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            {sets}세트 × {reps}회{weight ? ` · ${weight}kg` : ''}
          </Text>
        </View>

        {isActive && currentSet !== undefined && (
          <View style={[styles.setIndicator, { backgroundColor: baseColor, borderRadius: radii.full }]}>
            <Text style={{ color: colors.card, fontSize: typography.size.xs, fontWeight: '700' }}>
              {currentSet}/{sets}
            </Text>
          </View>
        )}
      </View>

      {/* 진행 바 */}
      {isActive && currentSet !== undefined && (
        <View style={[styles.progressBar, { backgroundColor: colors.secondary, borderRadius: radii.full, marginTop: spacing.xs }]}>
          <View style={[styles.progressFill, { width: `${(currentSet / sets) * 100}%`, backgroundColor: baseColor, borderRadius: radii.full }]} />
        </View>
      )}

      {/* 액션 버튼 */}
      {exerciseStatus === 'pending' && (
        <View style={[styles.actionRow, { marginTop: spacing.xs }]}>
          <Pressable onPress={onStart} style={[styles.actionBtn, { backgroundColor: baseColor, borderRadius: radii.xl }]}>
            <Text style={{ color: colors.card, fontSize: typography.size.xs, fontWeight: '600' }}>시작</Text>
          </Pressable>
          <Pressable onPress={onSkip} style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: radii.xl }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>건너뛰기</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  setIndicator: { paddingHorizontal: spacing.smd, paddingVertical: 3 },
  progressBar: { height: spacing.xs },
  progressFill: { height: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 6 },
});
