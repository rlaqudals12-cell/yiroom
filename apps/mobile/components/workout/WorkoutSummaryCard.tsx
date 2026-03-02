/**
 * 운동 요약 카드
 *
 * 주간/월간 운동 통계를 2x2 그리드로 표시.
 * 총 운동 횟수, 총 시간, 총 칼로리, 연속 일수.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Dumbbell, Clock, Flame, Trophy } from 'lucide-react-native';

import { useTheme } from '../../lib/theme';

export interface WorkoutSummaryCardProps {
  period: 'week' | 'month';
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  streakDays: number;
  testID?: string;
}

const PERIOD_LABEL: Record<string, string> = {
  week: '이번 주',
  month: '이번 달',
};

function StatBox({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
}): React.ReactElement {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <View
      style={[
        styles.statBox,
        {
          backgroundColor: colors.secondary,
          borderRadius: radii.lg,
          padding: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: `${accentColor}20`,
            borderRadius: 9999,
          },
        ]}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginTop: spacing.xs,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function WorkoutSummaryCard({
  period,
  totalWorkouts,
  totalDuration,
  totalCalories,
  streakDays,
  testID = 'workout-summary-card',
}: WorkoutSummaryCardProps): React.ReactElement {
  const { colors, brand, module, spacing, typography, radii, shadows } = useTheme();

  // 시간 포맷: 60분 이상이면 시간+분으로 표시
  const durationText =
    totalDuration >= 60
      ? `${Math.floor(totalDuration / 60)}시간 ${totalDuration % 60}분`
      : `${totalDuration}분`;

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID={testID}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md,
            ...shadows.card,
          },
        ]}
        accessibilityLabel={`${PERIOD_LABEL[period]} 운동 요약: ${totalWorkouts}회, ${durationText}, ${totalCalories}kcal, ${streakDays}일 연속`}
      >
        {/* 헤더 */}
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {PERIOD_LABEL[period]} 운동 요약
        </Text>

        {/* 2x2 그리드 */}
        <View style={[styles.grid, { marginTop: spacing.sm, gap: spacing.sm }]}>
          <StatBox
            icon={<Dumbbell size={16} color={brand.primary} />}
            label="운동 횟수"
            value={`${totalWorkouts}회`}
            accentColor={brand.primary}
          />
          <StatBox
            icon={<Clock size={16} color={module.workout.base} />}
            label="총 시간"
            value={durationText}
            accentColor={module.workout.base}
          />
          <StatBox
            icon={<Flame size={16} color={module.workout.base} />}
            label="소모 칼로리"
            value={`${totalCalories.toLocaleString()}kcal`}
            accentColor={module.workout.base}
          />
          <StatBox
            icon={<Trophy size={16} color={brand.primary} />}
            label="연속 일수"
            value={`${streakDays}일`}
            accentColor={brand.primary}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
