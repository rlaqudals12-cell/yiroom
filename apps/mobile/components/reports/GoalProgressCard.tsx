/**
 * GoalProgressCard — 목표 달성 카드
 *
 * 설정된 목표 대비 현재 진행률을 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface GoalProgressCardProps {
  title: string;
  emoji?: string;
  current: number;
  target: number;
  unit: string;
  style?: ViewStyle;
}

export function GoalProgressCard({
  title,
  emoji = '🎯',
  current,
  target,
  unit,
  style,
}: GoalProgressCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand, status } = useTheme();

  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const percentage = Math.round(progress * 100);
  const isComplete = percentage >= 100;

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
      testID="goal-progress-card"
      accessibilityLabel={`${title} 목표 ${percentage}% 달성`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>{emoji}</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
            flex: 1,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: isComplete ? status.success : brand.primary,
          }}
        >
          {percentage}%
        </Text>
      </View>

      {/* 프로그레스 바 */}
      <View
        style={[
          styles.barBg,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: 8,
            backgroundColor: isComplete ? status.success : brand.primary,
            borderRadius: radii.full,
          }}
        />
      </View>

      <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xs }}>
        {current}{unit} / {target}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    height: 8,
    overflow: 'hidden',
  },
});
