/**
 * 운동 이력 카드
 *
 * 과거 운동 세션 요약을 표시하는 카드.
 * 날짜, 운동 유형 뱃지, 시간, 칼로리, 운동 수 포함.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Dumbbell, Flame, Clock, Hash } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';

export interface WorkoutHistoryCardProps {
  date: string;
  workoutType: string;
  duration: number;
  caloriesBurned: number;
  exerciseCount: number;
  onPress?: () => void;
  testID?: string;
}

export function WorkoutHistoryCard({
  date,
  workoutType,
  duration,
  caloriesBurned,
  exerciseCount,
  onPress,
  testID = 'workout-history-card',
}: WorkoutHistoryCardProps): React.ReactElement {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  const handlePress = (): void => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID={testID}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md,
            ...shadows.card,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${date} ${workoutType} 운동, ${duration}분, ${caloriesBurned}kcal`}
      >
        {/* 헤더: 날짜 + 운동 유형 뱃지 */}
        <View style={styles.header}>
          <View>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              {date}
            </Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: `${module.workout.base}20`,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Dumbbell size={12} color={module.workout.base} />
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: module.workout.base,
                marginLeft: spacing.xs,
              }}
            >
              {workoutType}
            </Text>
          </View>
        </View>

        {/* 통계 행 */}
        <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
          <View style={styles.statItem}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.semibold,
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
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              }}
            >
              {caloriesBurned}kcal
            </Text>
          </View>

          <View style={styles.statItem}>
            <Hash size={14} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              }}
            >
              {exerciseCount}개
            </Text>
          </View>
        </View>
      </Pressable>
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
