/**
 * ConditionSelector — 피부 증상 선택기
 *
 * 여러 증상 칩을 선택/해제할 수 있는 다중 선택 컴포넌트.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ConditionOption {
  id: string;
  label: string;
  emoji?: string;
}

export interface ConditionSelectorProps {
  title?: string;
  options: ConditionOption[];
  selected: string[];
  onToggle?: (id: string) => void;
  style?: ViewStyle;
}

export function ConditionSelector({
  title = '피부 증상',
  options,
  selected,
  onToggle,
  style,
}: ConditionSelectorProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module } = useTheme();

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
      testID="condition-selector"
      accessibilityLabel={`${title}, ${selected.length}개 선택됨`}
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

      <View style={[styles.chipRow, { gap: spacing.sm }]}>
        {options.map((opt) => {
          const isActive = selected.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? module.skin.base : colors.secondary,
                  borderRadius: radii.full,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.smx,
                },
              ]}
              onPress={() => onToggle?.(opt.id)}
              accessibilityLabel={`${opt.label}${isActive ? ', 선택됨' : ''}`}
              accessibilityRole="button"
            >
              {opt.emoji && (
                <Text style={{ fontSize: typography.size.sm, marginRight: spacing.xxs }}>
                  {opt.emoji}
                </Text>
              )}
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: isActive ? typography.weight.bold : typography.weight.normal,
                  color: isActive ? colors.overlayForeground : colors.foreground,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
