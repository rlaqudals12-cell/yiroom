/**
 * LifestyleFactors — 라이프스타일 요인 입력
 *
 * 수면, 스트레스, 운동, 식단 등 피부에 영향을 주는 생활 요인 기록.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface LifestyleFactor {
  id: string;
  label: string;
  emoji: string;
  /** 1~5 점수 */
  value: number;
}

export interface LifestyleFactorsProps {
  factors: LifestyleFactor[];
  onValueChange?: (id: string, value: number) => void;
  style?: ViewStyle;
}

const LEVELS = [1, 2, 3, 4, 5] as const;

export function LifestyleFactors({
  factors,
  onValueChange,
  style,
}: LifestyleFactorsProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, status } = useTheme();

  const levelColor = (level: number, value: number): string => {
    if (level > value) return colors.muted;
    if (value >= 4) return status.success;
    if (value >= 2) return status.warning;
    return status.error;
  };

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
      testID="lifestyle-factors"
      accessibilityLabel={`라이프스타일 요인 ${factors.length}개`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        생활 요인
      </Text>

      {factors.map((factor) => (
        <View
          key={factor.id}
          style={[styles.factorRow, { marginBottom: spacing.sm }]}
          accessibilityLabel={`${factor.label}: ${factor.value}점`}
        >
          <View style={styles.factorLabel}>
            <Text style={{ fontSize: typography.size.base }}>{factor.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                marginLeft: spacing.xs,
                fontWeight: typography.weight.medium,
              }}
            >
              {factor.label}
            </Text>
          </View>
          <View style={[styles.levelRow, { gap: spacing.xs }]}>
            {LEVELS.map((lvl) => (
              <Pressable
                key={lvl}
                style={[
                  styles.levelDot,
                  {
                    backgroundColor: levelColor(lvl, factor.value),
                    borderRadius: radii.sm,
                  },
                ]}
                onPress={() => onValueChange?.(factor.id, lvl)}
                accessibilityLabel={`${factor.label} ${lvl}점`}
                accessibilityRole="button"
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelDot: {
    width: 20,
    height: 20,
  },
});
