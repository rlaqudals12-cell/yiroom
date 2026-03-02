/**
 * RoutineStepList — 루틴 단계 목록
 *
 * 스킨케어 루틴의 각 단계를 체크리스트로 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface RoutineStep {
  id: string;
  order: number;
  name: string;
  product?: string;
  completed: boolean;
  durationSeconds?: number;
}

export interface RoutineStepListProps {
  steps: RoutineStep[];
  onToggle?: (id: string) => void;
  style?: ViewStyle;
}

export function RoutineStepList({
  steps,
  onToggle,
  style,
}: RoutineStepListProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, status } = useTheme();

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
      testID="routine-step-list"
      accessibilityLabel={`루틴 단계 ${steps.length}개`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        루틴 단계
      </Text>

      {steps.map((step, idx) => (
        <Pressable
          key={step.id}
          style={[
            styles.stepRow,
            {
              paddingVertical: spacing.sm,
              borderBottomWidth: idx < steps.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => onToggle?.(step.id)}
          accessibilityLabel={`${step.order}단계 ${step.name}${step.completed ? ', 완료' : ''}`}
          accessibilityRole="button"
        >
          {/* 체크 */}
          <View
            style={[
              styles.check,
              {
                backgroundColor: step.completed ? module.skin.base : 'transparent',
                borderColor: step.completed ? module.skin.base : colors.border,
                borderRadius: radii.sm,
              },
            ]}
          >
            {step.completed && (
              <Text style={{ fontSize: 10, color: colors.overlayForeground, textAlign: 'center' }}>✓</Text>
            )}
          </View>

          {/* 내용 */}
          <View style={[styles.stepContent, { marginLeft: spacing.sm }]}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: step.completed ? colors.mutedForeground : colors.foreground,
                textDecorationLine: step.completed ? 'line-through' : 'none',
              }}
            >
              {step.order}. {step.name}
            </Text>
            {step.product && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xxs,
                }}
              >
                {step.product}
              </Text>
            )}
          </View>

          {/* 시간 */}
          {step.durationSeconds !== undefined && (
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              {step.durationSeconds}초
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  check: {
    width: 22,
    height: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
});
