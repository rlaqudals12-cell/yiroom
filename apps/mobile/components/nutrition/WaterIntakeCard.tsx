/**
 * WaterIntakeCard — 수분 섭취 추적 카드
 *
 * 하루 수분 섭취량 + 목표 대비 진행률 + 증감 버튼.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface WaterIntakeCardProps {
  /** 현재 섭취량 (ml) */
  current: number;
  /** 목표량 (ml) */
  goal: number;
  /** 1회 증가량 (기본 250ml) */
  step?: number;
  /** 증가 콜백 */
  onAdd?: (amount: number) => void;
  /** 감소 콜백 */
  onRemove?: (amount: number) => void;
  style?: ViewStyle;
}

export function WaterIntakeCard({
  current,
  goal,
  step = 250,
  onAdd,
  onRemove,
  style,
}: WaterIntakeCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  const pct = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  const glasses = Math.floor(current / step);
  const isComplete = current >= goal;

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
      testID="water-intake-card"
      accessibilityLabel={`수분 섭취 ${current}/${goal}ml, ${pct}% 달성`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          💧 수분 섭취
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: isComplete ? status.success : colors.mutedForeground,
            fontWeight: typography.weight.semibold,
          }}
        >
          {isComplete ? '달성!' : `${pct}%`}
        </Text>
      </View>

      {/* 물잔 표시 */}
      <View style={[styles.glassRow, { marginTop: spacing.sm }]}>
        {Array.from({ length: Math.ceil(goal / step) }, (_, i) => (
          <View
            key={i}
            style={[
              styles.glass,
              {
                backgroundColor: i < glasses ? '#60A5FA' : colors.muted,
                borderRadius: radii.sm,
              },
            ]}
          />
        ))}
      </View>

      {/* 수치 */}
      <View style={[styles.valueRow, { marginTop: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {current}
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginLeft: spacing.xs,
          }}
        >
          / {goal}ml
        </Text>
      </View>

      {/* 버튼 */}
      <View style={[styles.btnRow, { marginTop: spacing.sm }]}>
        {onRemove && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
              },
            ]}
            onPress={() => onRemove(step)}
            accessibilityLabel={`${step}ml 감소`}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              -{step}ml
            </Text>
          </Pressable>
        )}
        {onAdd && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: '#60A5FA',
                borderRadius: radii.lg,
              },
            ]}
            onPress={() => onAdd(step)}
            accessibilityLabel={`${step}ml 추가`}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: '#FFFFFF',
              }}
            >
              +{step}ml
            </Text>
          </Pressable>
        )}
      </View>
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
  glassRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  glass: {
    width: 20,
    height: 28,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
