/**
 * ChallengeProgress — 챌린지 진행 상세
 *
 * 챌린지의 일별 진행 기록을 표시하는 상세 카드.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface DayProgress {
  day: number;
  completed: boolean;
}

export interface ChallengeProgressProps {
  title: string;
  days: DayProgress[];
  streak: number;
  style?: ViewStyle;
}

export function ChallengeProgress({
  title,
  days,
  streak,
  style,
}: ChallengeProgressProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  const completedDays = days.filter((d) => d.completed).length;

  return (
    <View
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
      testID="challenge-progress"
      accessibilityLabel={`${title}, ${completedDays}/${days.length}일 완료, ${streak}일 연속`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>

      {/* 일별 도트 그리드 */}
      <View style={[styles.dotsRow, { gap: spacing.xs }]}>
        {days.map((day) => (
          <View
            key={day.day}
            style={[
              styles.dot,
              {
                backgroundColor: day.completed ? status.success : colors.secondary,
                borderRadius: radii.sm,
              },
            ]}
            accessibilityLabel={`${day.day}일차${day.completed ? ', 완료' : ''}`}
          />
        ))}
      </View>

      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {completedDays}/{days.length}일 완료
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            color: status.success,
          }}
        >
          🔥 {streak}일 연속
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dot: {
    width: 20,
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
