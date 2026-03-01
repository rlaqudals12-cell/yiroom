/**
 * RoutineCard — 스킨케어 루틴 카드
 *
 * 아침/저녁 루틴의 전체 요약. 단계 수, 소요 시간, 완료율.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type RoutineTime = 'morning' | 'evening';

export interface RoutineCardProps {
  routineTime: RoutineTime;
  totalSteps: number;
  completedSteps: number;
  estimatedMinutes?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function RoutineCard({
  routineTime,
  totalSteps,
  completedSteps,
  estimatedMinutes,
  onPress,
  style,
}: RoutineCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module } = useTheme();

  const isMorning = routineTime === 'morning';
  const emoji = isMorning ? '🌅' : '🌙';
  const label = isMorning ? '모닝 루틴' : '나이트 루틴';
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const isComplete = completedSteps >= totalSteps;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID="routine-card"
      accessibilityLabel={`${label}, ${completedSteps}/${totalSteps}단계 완료`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={{ fontSize: typography.size.lg }}>{emoji}</Text>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginLeft: spacing.xs,
            }}
          >
            {label}
          </Text>
        </View>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: isComplete ? module.skin.base : colors.mutedForeground,
          }}
        >
          {isComplete ? '완료!' : `${pct}%`}
        </Text>
      </View>

      {/* 프로그레스 바 */}
      <View
        style={[
          styles.progressBg,
          {
            backgroundColor: colors.muted,
            borderRadius: radii.sm,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: module.skin.base,
              borderRadius: radii.sm,
              width: `${pct}%` as unknown as number,
            },
          ]}
        />
      </View>

      {/* 하단 정보 */}
      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {completedSteps}/{totalSteps}단계
        </Text>
        {estimatedMinutes !== undefined && (
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            약 {estimatedMinutes}분
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBg: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
