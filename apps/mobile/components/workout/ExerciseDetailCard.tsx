/**
 * 운동 상세 카드
 *
 * 개별 운동의 세부 정보를 표시.
 * 이름, 세트x반복, 중량, MET, 시간, 칼로리 포함.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Dumbbell, Timer, Flame } from 'lucide-react-native';

import { useTheme } from '../../lib/theme';

export interface ExerciseDetailCardProps {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  met: number;
  duration: number;
  caloriesBurned: number;
  testID?: string;
}

export function ExerciseDetailCard({
  name,
  sets,
  reps,
  weight,
  met,
  duration,
  caloriesBurned,
  testID = 'exercise-detail-card',
}: ExerciseDetailCardProps): React.ReactElement {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  // 세트x반복 + 중량 문자열
  const setRepText = weight
    ? `${sets}세트 x ${reps}회 (${weight}kg)`
    : `${sets}세트 x ${reps}회`;

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
        accessibilityLabel={`${name}, ${setRepText}, ${duration}분, ${caloriesBurned}kcal`}
      >
        {/* 상단: 이름 + MET 뱃지 */}
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Dumbbell size={18} color={module.workout.base} />
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginLeft: spacing.sm,
                flex: 1,
              }}
            >
              {name}
            </Text>
          </View>
          <View
            style={[
              styles.metBadge,
              {
                backgroundColor: `${module.workout.base}20`,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: module.workout.base,
              }}
            >
              MET {met}
            </Text>
          </View>
        </View>

        {/* 세트/반복 정보 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginTop: spacing.sm,
          }}
        >
          {setRepText}
        </Text>

        {/* 하단 통계 */}
        <View
          style={[
            styles.statsRow,
            {
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Timer size={14} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.medium,
                marginLeft: spacing.xs,
              }}
            >
              {duration}분
            </Text>
          </View>

          <View style={styles.statItem}>
            <Flame size={14} color={module.workout.base} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.medium,
                marginLeft: spacing.xs,
              }}
            >
              {caloriesBurned}kcal
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metBadge: {},
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
