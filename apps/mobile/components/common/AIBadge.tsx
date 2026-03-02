/**
 * AI 분석 결과 배지 컴포넌트
 *
 * AI 기본법 제31조 (2026.1.22 시행) 준수
 * — AI 생성 결과임을 사용자에게 명시
 *
 * @see docs/adr/ADR-024-ai-transparency.md
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, aiColors, spacing, radii, typography } from '../../lib/theme';

export type AIBadgeVariant = 'default' | 'small' | 'inline' | 'card';

interface AIBadgeProps {
  /** 배지 스타일 변형 */
  variant?: AIBadgeVariant;
  /** 커스텀 라벨 (기본: "AI 분석 결과") */
  label?: string;
  /** 접근성 설명 */
  description?: string;
}

export function AIBadge({
  variant = 'default',
  label = 'AI 분석 결과',
  description = '이 결과는 AI 기술을 사용하여 생성되었어요',
}: AIBadgeProps): React.ReactElement {
  const { isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';

  const sizeStyle = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        styles.container,
        sizeStyle.container,
        {
          backgroundColor: aiColors.background[mode],
          borderColor: aiColors.border[mode],
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={description}
      testID="ai-badge"
    >
      <Text
        style={[sizeStyle.icon, { color: aiColors.text[mode] }]}
        accessibilityElementsHidden
      >
        ✨
      </Text>
      <Text
        style={[
          sizeStyle.label,
          {
            color: aiColors.title[mode],
            fontWeight: typography.weight.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const VARIANT_STYLES = {
  default: {
    container: {
      paddingHorizontal: spacing.smd,
      paddingVertical: spacing.xs,
    },
    icon: { fontSize: typography.size.sm },
    label: { fontSize: typography.size.xs },
  },
  small: {
    container: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
    },
    icon: { fontSize: typography.size.xs },
    label: { fontSize: 10 },
  },
  inline: {
    container: {
      paddingHorizontal: 6,
      paddingVertical: spacing.xxs,
    },
    icon: { fontSize: 10 },
    label: { fontSize: 10 },
  },
  card: {
    container: {
      paddingHorizontal: spacing.smx,
      paddingVertical: 6,
    },
    icon: { fontSize: typography.size.base },
    label: { fontSize: typography.size.sm },
  },
} as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
});
