/**
 * 세트 추적기
 *
 * 운동 세트별 진행 상태 및 기록 표시
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type SetStatus = 'completed' | 'skipped' | 'pending' | 'current';

export interface SetRecord {
  setNumber: number;
  targetReps: number;
  targetWeight?: number;
  status: SetStatus;
  actualReps?: number;
  actualWeight?: number;
}

export interface SetTrackerProps {
  exerciseName: string;
  sets: SetRecord[];
  onSetComplete?: (setNumber: number, reps: number, weight?: number) => void;
  onSetSkip?: (setNumber: number) => void;
}

const STATUS_ICONS: Record<SetStatus, string> = {
  completed: '✓', skipped: '✗', pending: '○', current: '●',
};

export function SetTracker({
  exerciseName, sets, onSetComplete, onSetSkip,
}: SetTrackerProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;
  const completedSets = sets.filter((s) => s.status === 'completed').length;

  return (
    <View
      testID="set-tracker"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`${exerciseName} 세트 추적, ${completedSets}/${sets.length} 완료`}
    >
      <View style={styles.header}>
        <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700' }}>
          {exerciseName}
        </Text>
        <Text style={{ color: baseColor, fontSize: typography.size.sm, fontWeight: '600' }}>
          {completedSets}/{sets.length}
        </Text>
      </View>

      {/* 진행 바 */}
      <View style={[styles.progressBar, { backgroundColor: colors.secondary, borderRadius: radii.full, marginTop: spacing.xs }]}>
        <View style={[styles.progressFill, { width: `${(completedSets / sets.length) * 100}%`, backgroundColor: baseColor, borderRadius: radii.full }]} />
      </View>

      {/* 세트 목록 */}
      <View style={{ marginTop: spacing.sm }}>
        {sets.map((set) => {
          const isCurrent = set.status === 'current';
          const statusColor = set.status === 'completed' ? status.success
            : set.status === 'skipped' ? colors.mutedForeground
            : isCurrent ? baseColor
            : colors.secondary;

          return (
            <View
              key={set.setNumber}
              style={[
                styles.setRow,
                {
                  backgroundColor: isCurrent ? `${baseColor}10` : 'transparent',
                  borderRadius: radii.md,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.statusIcon, { backgroundColor: statusColor, borderRadius: 10 }]}>
                <Text style={{ color: colors.card, fontSize: 10, fontWeight: '700' }}>
                  {STATUS_ICONS[set.status]}
                </Text>
              </View>

              <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', width: 50 }}>
                {set.setNumber}세트
              </Text>

              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, flex: 1 }}>
                목표: {set.targetReps}회{set.targetWeight ? ` × ${set.targetWeight}kg` : ''}
              </Text>

              {set.status === 'completed' && set.actualReps !== undefined && (
                <Text style={{ color: status.success, fontSize: typography.size.xs, fontWeight: '600' }}>
                  {set.actualReps}회{set.actualWeight ? ` × ${set.actualWeight}kg` : ''}
                </Text>
              )}

              {isCurrent && (
                <View style={styles.actionBtns}>
                  <Pressable
                    onPress={() => onSetComplete?.(set.setNumber, set.targetReps, set.targetWeight)}
                    style={[styles.smallBtn, { backgroundColor: status.success, borderRadius: radii.sm }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${set.setNumber}세트 완료`}
                  >
                    <Text style={{ color: colors.card, fontSize: 10, fontWeight: '700' }}>완료</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onSetSkip?.(set.setNumber)}
                    style={[styles.smallBtn, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${set.setNumber}세트 건너뛰기`}
                  >
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>스킵</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBar: { height: 4 },
  progressFill: { height: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  statusIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 4 },
});
