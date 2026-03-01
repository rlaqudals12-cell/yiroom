/**
 * LevelProgress — 레벨 진행 바
 *
 * 현재 레벨과 다음 레벨까지의 XP 진행률 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface LevelProgressProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  style?: ViewStyle;
}

export function LevelProgress({
  level,
  currentXP,
  requiredXP,
  style,
}: LevelProgressProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  const progress = requiredXP > 0 ? Math.min(currentXP / requiredXP, 1) : 0;
  const percentage = Math.round(progress * 100);

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
      testID="level-progress"
      accessibilityLabel={`레벨 ${level}, ${currentXP}/${requiredXP} XP, ${percentage}%`}
    >
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          Lv.{level}
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {currentXP}/{requiredXP} XP
        </Text>
      </View>

      <View
        style={[
          styles.trackBar,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.fillBar,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.full,
              width: `${percentage}%` as unknown as number,
            },
          ]}
        />
      </View>

      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
          textAlign: 'right',
        }}
      >
        다음 레벨까지 {requiredXP - currentXP} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackBar: {
    height: 8,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
  },
});
