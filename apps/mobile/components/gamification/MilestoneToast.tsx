/**
 * MilestoneToast — 마일스톤 토스트
 *
 * 마일스톤 달성 시 화면 상단에 표시되는 토스트 알림.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface MilestoneToastProps {
  title: string;
  description?: string;
  emoji?: string;
  style?: ViewStyle;
}

export function MilestoneToast({
  title,
  description,
  emoji = '🏆',
  style,
}: MilestoneToastProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, grade } = useTheme();

  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: grade.gold.light,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.md,
        },
        style,
      ]}
      testID="milestone-toast"
      accessibilityLabel={`마일스톤 달성: ${title}`}
      accessibilityRole="alert"
    >
      <Text style={{ fontSize: typography.size.xl }}>{emoji}</Text>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: grade.gold.dark,
          }}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: typography.size.xs,
              color: grade.gold.text,
              marginTop: spacing.xxs,
            }}
          >
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
