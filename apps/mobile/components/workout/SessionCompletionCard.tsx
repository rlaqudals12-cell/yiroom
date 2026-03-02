/**
 * 세션 완료 카드
 *
 * 운동 세션 완료 후 요약 표시
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface SessionCompletionCardProps {
  totalDuration: number;
  totalCalories: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  setsCompleted: number;
  setsTotal: number;
  onShare?: () => void;
  onGoBack?: () => void;
}

export function SessionCompletionCard({
  totalDuration, totalCalories, exercisesCompleted, exercisesTotal,
  setsCompleted, setsTotal, onShare, onGoBack,
}: SessionCompletionCardProps): React.ReactElement {
  const { colors, module, status, brand, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;
  const completionRate = Math.round((exercisesCompleted / exercisesTotal) * 100);

  return (
    <View
      testID="session-completion-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border, padding: spacing.lg }]}
      accessibilityLabel={`운동 완료! ${totalDuration}분, ${totalCalories}kcal`}
    >
      <Text style={{ fontSize: typography.size['2xl'], textAlign: 'center' }}>🎉</Text>
      <Text style={{ color: colors.foreground, fontSize: typography.size.xl, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs }}>
        운동 완료!
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
        수고하셨어요
      </Text>

      {/* 통계 */}
      <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
        {[
          { label: '운동 시간', value: `${totalDuration}분`, emoji: '⏱️' },
          { label: '소모 칼로리', value: `${totalCalories}kcal`, emoji: '🔥' },
          { label: '운동 완료', value: `${exercisesCompleted}/${exercisesTotal}`, emoji: '💪' },
          { label: '세트 완료', value: `${setsCompleted}/${setsTotal}`, emoji: '✅' },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statItem, { backgroundColor: `${baseColor}10`, borderRadius: radii.md }]}>
            <Text style={{ fontSize: typography.size.base }}>{stat.emoji}</Text>
            <Text style={{ color: baseColor, fontSize: typography.size.base, fontWeight: '700' }}>{stat.value}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* 완성도 */}
      <View style={[styles.completionRow, { marginTop: spacing.md }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>완성도</Text>
        <Text style={{ color: completionRate >= 80 ? status.success : status.warning, fontSize: typography.size.lg, fontWeight: '700' }}>
          {completionRate}%
        </Text>
      </View>

      {/* 액션 */}
      <View style={[styles.actionRow, { marginTop: spacing.md }]}>
        {onShare && (
          <Pressable
            onPress={onShare}
            style={[styles.actionBtn, { backgroundColor: baseColor, borderRadius: radii.md }]}
            accessibilityRole="button"
            accessibilityLabel="결과 공유하기"
          >
            <Text style={{ color: colors.card, fontSize: typography.size.sm, fontWeight: '600' }}>공유하기</Text>
          </Pressable>
        )}
        {onGoBack && (
          <Pressable
            onPress={onGoBack}
            style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: radii.md }]}
            accessibilityRole="button"
            accessibilityLabel="돌아가기"
          >
            <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>돌아가기</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%' },
  statItem: { width: '47%', alignItems: 'center', padding: spacing.smx, gap: spacing.xxs },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  actionRow: { flexDirection: 'row', gap: spacing.smd },
  actionBtn: { paddingHorizontal: spacing.mlg, paddingVertical: spacing.smd },
});
